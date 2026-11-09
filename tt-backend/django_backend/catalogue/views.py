from decimal import Decimal
from django.db.models import Case, Count, DecimalField, ExpressionWrapper, F, Q, Sum, Value, When
from rest_framework import generics, status, views
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import Author, Book, BookEdition, BookImage, Genre, Publisher, Review, ReviewVote, RecentlyViewed
from .pagination import CataloguePagination
from .serializers import (
    AuthorSerializer, BookDetailSerializer, BookSerializer, GenreSerializer,
    PublisherSerializer, ReviewSerializer
)
from .services.book_importer import BookImporterService


class BookListView(generics.ListAPIView):
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    pagination_class = CataloguePagination

    def get_queryset(self):
        query = self.request.query_params
        books = Book.objects.filter(is_published=True).select_related("publisher").prefetch_related("authors", "genres", "editions")

        search = query.get("q", "").strip()
        search_category = query.get("search_category", "").strip()
        if search:
            books = books.filter(
                Q(title__icontains=search) | Q(subtitle__icontains=search) |
                Q(author__icontains=search) | Q(isbn10__icontains=search) |
                Q(isbn13__icontains=search) | Q(publisher_name__icontains=search) |
                Q(genre__icontains=search) | Q(description__icontains=search)
            )

        if search_category and search_category not in ("All", "all", "All Departments"):
            books = books.filter(Q(genre__icontains=search_category) | Q(genres__name__icontains=search_category))

        genre = query.get("genre") or query.get("category")
        if genre and genre not in ("All", "all"):
            books = books.filter(Q(genre__iexact=genre) | Q(genres__name__iexact=genre) | Q(genres__slug__iexact=genre)).distinct()

        if query.get("minPrice"):
            try:
                books = books.filter(price__gte=Decimal(query["minPrice"]))
            except Exception:
                pass
        if query.get("maxPrice"):
            try:
                books = books.filter(price__lte=Decimal(query["maxPrice"]))
            except Exception:
                pass

        if query.get("minRating"):
            try:
                books = books.filter(rating__gte=Decimal(query["minRating"]))
            except Exception:
                pass

        if query.get("minDiscount"):
            try:
                min_d = int(query["minDiscount"])
                books = books.filter(deal_discount__gte=min_d)
            except Exception:
                pass

        if query.get("format"):
            books = books.filter(Q(format__iexact=query["format"]) | Q(editions__format__iexact=query["format"])).distinct()

        if query.get("language"):
            books = books.filter(language__iexact=query["language"])

        if query.get("author"):
            books = books.filter(author__icontains=query["author"])

        if query.get("publisher"):
            books = books.filter(publisher_name__icontains=query["publisher"])

        if query.get("bestseller") == "true":
            books = books.filter(is_bestseller=True)

        if query.get("new_release") == "true":
            books = books.filter(is_new_release=True)

        if query.get("featured") == "true":
            books = books.filter(is_featured=True)

        if query.get("deals") == "true":
            books = books.filter(Q(deal_discount__gt=0) | Q(mrp__gt=F("price")))

        if query.get("available") == "true":
            books = books.filter(stock__gt=0)

        sort = query.get("sort", "featured")
        if sort == "popularity":
            books = books.annotate(
                _units_sold=Sum(
                    "order_items__quantity",
                    filter=Q(order_items__order__status__in=["CONFIRMED", "DEMO_CONFIRMED", "DELIVERED", "SHIPPED"]),
                    default=0,
                )
            )
            return books.order_by("-_units_sold", "-rating", "title")
        if sort == "bestselling":
            return books.order_by("-is_bestseller", "-rating", "-review_count", "title")
        if sort == "discount":
            discount = ExpressionWrapper(
                (F("mrp") - F("price")) * Value(100) / F("mrp"),
                output_field=DecimalField(max_digits=7, decimal_places=2),
            )
            books = books.annotate(_discount=Case(
                When(mrp__gt=0, then=discount),
                default=Value(0),
                output_field=DecimalField(max_digits=7, decimal_places=2),
            ))
            return books.order_by("-_discount", "price", "title")
        if sort == "price-asc":
            return books.order_by("price", "title")
        if sort == "price-desc":
            return books.order_by("-price", "title")
        if sort == "rating":
            return books.order_by("-rating", "-review_count", "title")
        if sort == "newest":
            return books.order_by("-is_new_release", "-year", "-created_at")
        if sort == "reviews":
            return books.order_by("-review_count", "-rating", "title")

        # default "featured"
        return books.order_by("-is_featured", "-is_bestseller", "-rating", "title")


class BookDetailView(generics.RetrieveAPIView):
    serializer_class = BookDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "id"
    queryset = Book.objects.filter(is_published=True).select_related("publisher").prefetch_related("authors", "genres", "editions", "images", "reviews")


class SearchAutocompleteView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        category = request.query_params.get("category", "").strip()
        if not query or len(query) < 2:
            return Response({"suggestions": [], "books": []})

        qs = Book.objects.filter(is_published=True)
        if category and category not in ("All", "all", "All Departments"):
            qs = qs.filter(genre__icontains=category)

        books = qs.filter(
            Q(title__icontains=query) | Q(author__icontains=query) | Q(genre__icontains=query)
        )[:6]

        book_results = [{
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "genre": b.genre,
            "price": float(b.price),
            "cover_url": b.cover_url,
            "rating": float(b.rating),
        } for b in books]

        # Suggestion phrases
        suggestions = []
        for b in books:
            if b.title not in suggestions:
                suggestions.append(b.title)
            if b.author not in suggestions and len(suggestions) < 8:
                suggestions.append(b.author)

        return Response({
            "query": query,
            "suggestions": suggestions[:8],
            "books": book_results,
        })


class DepartmentMegaMenuView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        parents = Genre.objects.filter(parent__isnull=True, is_active=True).prefetch_related(
            "subgenres"
        ).annotate(book_count=Count("books", filter=Q(books__is_published=True), distinct=True))

        data = []
        for p in parents:
            subs = p.subgenres.filter(is_active=True).annotate(
                book_count=Count("books", filter=Q(books__is_published=True), distinct=True)
            )
            data.append({
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "book_count": p.book_count,
                "subcategories": [{
                    "id": s.id,
                    "name": s.name,
                    "slug": s.slug,
                    "book_count": s.book_count,
                } for s in subs]
            })
        return Response(data)


class GenreListView(generics.ListAPIView):
    serializer_class = GenreSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Genre.objects.filter(is_active=True).annotate(
            book_count=Count("books", filter=Q(books__is_published=True), distinct=True)
        ).prefetch_related("subgenres")


class AuthorListView(generics.ListAPIView):
    serializer_class = AuthorSerializer
    permission_classes = [AllowAny]
    queryset = Author.objects.all()
    pagination_class = CataloguePagination


class AuthorDetailView(generics.RetrieveAPIView):
    serializer_class = AuthorSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    queryset = Author.objects.all()


class PublisherListView(generics.ListAPIView):
    serializer_class = PublisherSerializer
    permission_classes = [AllowAny]
    queryset = Publisher.objects.all()
    pagination_class = CataloguePagination


class PublisherDetailView(generics.RetrieveAPIView):
    serializer_class = PublisherSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    queryset = Publisher.objects.all()


class BookReviewListCreateView(views.APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, book_id):
        reviews = Review.objects.filter(book_id=book_id).select_related("user").order_by("-created_at")
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, book_id):
        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"error": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

        rating = request.data.get("rating")
        title = request.data.get("title", "").strip()
        comment = request.data.get("comment", "").strip()

        if not rating or not (1 <= int(rating) <= 5):
            return Response({"error": "Please provide a rating between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
        if not title or not comment:
            return Response({"error": "Title and comment are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user previously purchased this book (from commerce orders)
        from commerce.models import OrderItem
        has_purchased = OrderItem.objects.filter(order__user=request.user, book=book).exists()

        review, created = Review.objects.update_or_create(
            book=book,
            user=request.user,
            defaults={
                "rating": int(rating),
                "title": title,
                "comment": comment,
                "is_verified_purchase": has_purchased,
            }
        )
        book.recalculate_ratings()
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class ReviewVoteView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):
        try:
            review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return Response({"error": "Review not found."}, status=status.HTTP_404_NOT_FOUND)

        vote, created = ReviewVote.objects.get_or_create(
            review=review,
            user=request.user,
            defaults={"is_helpful": True}
        )
        if created:
            review.helpful_votes += 1
            review.save(update_fields=["helpful_votes"])

        return Response({"helpful_votes": review.helpful_votes})


class RecentlyViewedView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            views_qs = RecentlyViewed.objects.filter(user=request.user).select_related("book")[:12]
        else:
            session_key = request.session.session_key or ""
            views_qs = RecentlyViewed.objects.filter(session_id=session_key).select_related("book")[:12]

        books = [v.book for v in views_qs if v.book and v.book.is_published]
        return Response(BookSerializer(books, many=True).data)

    def post(self, request):
        book_id = request.data.get("bookId")
        if not book_id:
            return Response({"error": "bookId is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user.is_authenticated:
            RecentlyViewed.objects.update_or_create(
                user=request.user,
                book=book,
                defaults={"session_id": ""}
            )
        else:
            if not request.session.session_key:
                request.session.create()
            RecentlyViewed.objects.update_or_create(
                session_id=request.session.session_key,
                book=book,
                defaults={"user": None}
            )

        return Response({"success": True})


class RecommendationsView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        bestsellers = Book.objects.filter(is_published=True, is_bestseller=True)[:10]
        new_releases = Book.objects.filter(is_published=True, is_new_release=True)[:10]
        deals = Book.objects.filter(is_published=True, deal_discount__gt=0)[:10]
        top_rated = Book.objects.filter(is_published=True, rating__gte=4.6).order_by("-rating")[:10]
        under_299 = Book.objects.filter(is_published=True, price__lte=299).order_by("-rating")[:10]
        under_499 = Book.objects.filter(is_published=True, price__lte=499, price__gt=299).order_by("-rating")[:10]
        regional = Book.objects.filter(is_published=True, genre__icontains="Regional")[:10]

        return Response({
            "bestsellers": BookSerializer(bestsellers, many=True).data,
            "new_releases": BookSerializer(new_releases, many=True).data,
            "today_deals": BookSerializer(deals, many=True).data,
            "top_rated": BookSerializer(top_rated, many=True).data,
            "under_299": BookSerializer(under_299, many=True).data,
            "under_499": BookSerializer(under_499, many=True).data,
            "regional_spotlight": BookSerializer(regional, many=True).data,
        })


class BookImportView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        query = request.query_params.get("q", "")
        if not query:
            return Response({"results": []})
        results = BookImporterService.search_open_library(query, limit=8)
        return Response({"results": results})

    def post(self, request):
        metadata = request.data.get("metadata")
        if not metadata:
            return Response({"error": "metadata object is required."}, status=status.HTTP_400_BAD_REQUEST)

        genre_name = request.data.get("genre")
        is_bestseller = bool(request.data.get("is_bestseller", False))
        is_featured = bool(request.data.get("is_featured", False))
        deal_discount = int(request.data.get("deal_discount", 0))

        book, message = BookImporterService.import_from_metadata(
            metadata,
            genre_name=genre_name,
            is_bestseller=is_bestseller,
            is_featured=is_featured,
            deal_discount=deal_discount,
        )
        if not book:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

        return Response(BookSerializer(book).data, status=status.HTTP_201_CREATED)
