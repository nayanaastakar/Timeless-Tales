import re
import requests
from decimal import Decimal
from django.utils.text import slugify
from catalogue.models import Book, Author, Publisher, Genre, BookEdition, BookImage


def clean_isbn(isbn_str):
    if not isbn_str:
        return ""
    cleaned = re.sub(r"[^0-9X]", "", str(isbn_str).upper())
    return cleaned


class BookImporterService:
    OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
    OPEN_LIBRARY_ISBN_URL = "https://openlibrary.org/isbn/{isbn}.json"
    GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"

    @classmethod
    def search_open_library(cls, query, limit=10):
        try:
            resp = requests.get(
                cls.OPEN_LIBRARY_SEARCH_URL,
                params={"q": query, "limit": limit},
                timeout=8,
            )
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for doc in data.get("docs", []):
                    isbns = doc.get("isbn", [])
                    isbn13 = next((i for i in isbns if len(clean_isbn(i)) == 13), "")
                    isbn10 = next((i for i in isbns if len(clean_isbn(i)) == 10), "")
                    cover_id = doc.get("cover_i")
                    cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else ""
                    results.append({
                        "title": doc.get("title", ""),
                        "subtitle": doc.get("subtitle", ""),
                        "author": doc.get("author_name", ["Unknown Author"])[0] if doc.get("author_name") else "Unknown",
                        "all_authors": doc.get("author_name", []),
                        "publisher": doc.get("publisher", ["Independent"])[0] if doc.get("publisher") else "Independent",
                        "year": doc.get("first_publish_year") or 2020,
                        "isbn10": clean_isbn(isbn10),
                        "isbn13": clean_isbn(isbn13),
                        "cover_url": cover_url,
                        "page_count": doc.get("number_of_pages_median"),
                        "genre": doc.get("subject", ["General"])[0] if doc.get("subject") else "General",
                    })
                return results
        except Exception:
            pass
        return []

    @classmethod
    def import_from_metadata(cls, metadata, genre_name=None, is_bestseller=False, is_featured=False, is_new_release=False, deal_discount=0):
        title = metadata.get("title", "").strip()
        if not title:
            return None, "Title is required"

        author_name = metadata.get("author", "Unknown Author").strip()
        publisher_name = metadata.get("publisher", "Timeless Tales Press").strip()
        genre_str = genre_name or metadata.get("genre", "Literature & Fiction")
        
        # Normalize ISBNs
        isbn10 = clean_isbn(metadata.get("isbn10", "")) or None
        isbn13 = clean_isbn(metadata.get("isbn13", "")) or None

        # Check existing by ISBN or title
        existing = None
        if isbn13:
            existing = Book.objects.filter(isbn13=isbn13).first()
        if not existing and isbn10:
            existing = Book.objects.filter(isbn10=isbn10).first()
        if not existing:
            base_slug = slugify(title)[:200]
            existing = Book.objects.filter(slug=base_slug).first()

        author, _ = Author.objects.get_or_create(
            name=author_name,
            defaults={"biography": f"{author_name} is an acclaimed author with works published worldwide."}
        )
        publisher, _ = Publisher.objects.get_or_create(
            name=publisher_name,
            defaults={"about": f"{publisher_name} is a leading publisher of distinguished literature."}
        )
        genre, _ = Genre.objects.get_or_create(
            name=genre_str,
            defaults={"description": f"Curated selection of books in {genre_str}."}
        )

        price = Decimal(str(metadata.get("price", 399.00)))
        mrp = Decimal(str(metadata.get("mrp", round(float(price) * 1.3, 2))))
        year = int(metadata.get("year", 2022) or 2022)
        blurb = metadata.get("blurb", f"A captivating read by {author_name} exploring compelling themes and unforgettable characters.")
        description = metadata.get("description", blurb)
        cover_url = metadata.get("cover_url", "")
        rating = Decimal(str(metadata.get("rating", 4.5)))
        page_count = metadata.get("page_count") or 320

        book_id = metadata.get("id") or slugify(title)[:75]
        if Book.objects.filter(id=book_id).exclude(pk=existing.pk if existing else None).exists():
            book_id = f"{book_id}-{isbn13[-4:] if isbn13 else 'vol'}"

        if existing:
            book = existing
            book.title = title
            book.author = author_name
            book.publisher = publisher
            book.publisher_name = publisher_name
            book.genre = genre_str
            book.price = price
            book.mrp = mrp
            book.rating = rating
            book.year = year
            book.blurb = blurb
            book.description = description
            if cover_url:
                book.cover_url = cover_url
            book.isbn10 = isbn10
            book.isbn13 = isbn13
            book.page_count = page_count
            book.is_bestseller = is_bestseller or book.is_bestseller
            book.is_featured = is_featured or book.is_featured
            book.is_new_release = is_new_release or book.is_new_release
            book.deal_discount = deal_discount or book.deal_discount
            book.save()
        else:
            book = Book.objects.create(
                id=book_id,
                title=title,
                subtitle=metadata.get("subtitle", ""),
                author=author_name,
                publisher=publisher,
                publisher_name=publisher_name,
                genre=genre_str,
                price=price,
                mrp=mrp,
                rating=rating,
                year=year,
                blurb=blurb,
                description=description,
                stock=int(metadata.get("stock", 25)),
                isbn10=isbn10,
                isbn13=isbn13,
                language=metadata.get("language", "English"),
                page_count=page_count,
                format=metadata.get("format", Book.Format.PAPERBACK),
                cover_url=cover_url,
                is_published=True,
                is_bestseller=is_bestseller,
                is_featured=is_featured,
                is_new_release=is_new_release,
                deal_discount=deal_discount,
                sample_text=metadata.get("sample_text", "Read sample content available for authorized previews."),
            )

        book.authors.add(author)
        book.genres.add(genre)

        # Create standard BookEditions (Paperback, Hardcover, eBook)
        BookEdition.objects.get_or_create(
            book=book,
            format=Book.Format.PAPERBACK,
            defaults={
                "price": price,
                "mrp": mrp,
                "isbn10": isbn10 or "",
                "isbn13": isbn13 or "",
                "stock": 30,
                "page_count": page_count,
                "is_available": True,
            }
        )
        BookEdition.objects.get_or_create(
            book=book,
            format=Book.Format.HARDCOVER,
            defaults={
                "price": Decimal(str(round(float(price) * 1.6, 2))),
                "mrp": Decimal(str(round(float(mrp) * 1.5, 2))),
                "stock": 15,
                "page_count": page_count,
                "is_available": True,
            }
        )
        BookEdition.objects.get_or_create(
            book=book,
            format=Book.Format.EBOOK,
            defaults={
                "price": Decimal(str(round(float(price) * 0.45, 2))),
                "mrp": price,
                "stock": 999,
                "page_count": page_count,
                "is_available": True,
            }
        )

        return book, "Imported successfully"
