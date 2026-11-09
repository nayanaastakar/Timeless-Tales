from decimal import Decimal
from rest_framework import serializers

from .models import Author, Book, BookEdition, BookImage, Genre, Publisher, Review, ReviewVote, RecentlyViewed


class BookEditionSerializer(serializers.ModelSerializer):
    format_label = serializers.CharField(source="get_format_display", read_only=True)
    savings = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = BookEdition
        fields = [
            "id", "format", "format_label", "price", "mrp", "isbn10", "isbn13",
            "stock", "page_count", "is_available", "savings", "discount_percent",
        ]

    def get_savings(self, obj):
        if obj.mrp and obj.price and obj.mrp > obj.price:
            return float(obj.mrp - obj.price)
        return 0.0

    def get_discount_percent(self, obj):
        if obj.mrp and obj.price and obj.mrp > obj.price:
            return int(round(((obj.mrp - obj.price) / obj.mrp) * 100))
        return 0


class BookImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookImage
        fields = ["id", "image_url", "caption", "order"]


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    helpful_votes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "book", "rating", "title", "comment", "is_verified_purchase",
            "helpful_votes", "user_name", "created_at",
        ]
        read_only_fields = ["id", "is_verified_purchase", "helpful_votes", "created_at"]


class BookSerializer(serializers.ModelSerializer):
    editions = BookEditionSerializer(many=True, read_only=True)
    images = BookImageSerializer(many=True, read_only=True)
    savings = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id", "slug", "title", "subtitle", "author", "genre", "price", "mrp",
            "rating", "review_count", "year", "blurb", "hue", "stock", "description",
            "isbn10", "isbn13", "publisher_name", "language", "page_count", "format",
            "cover_url", "is_bestseller", "is_featured", "is_new_release", "deal_discount",
            "reading_age", "dimensions", "weight", "sample_text", "editions", "images",
            "savings", "discount_percent",
        ]

    def get_savings(self, obj):
        if obj.mrp and obj.price and obj.mrp > obj.price:
            return float(obj.mrp - obj.price)
        return 0.0

    def get_discount_percent(self, obj):
        if obj.mrp and obj.price and obj.mrp > obj.price:
            return int(round(((obj.mrp - obj.price) / obj.mrp) * 100))
        return 0


class BookDetailSerializer(BookSerializer):
    reviews = serializers.SerializerMethodField()
    rating_breakdown = serializers.SerializerMethodField()
    related_books = serializers.SerializerMethodField()

    class Meta(BookSerializer.Meta):
        fields = BookSerializer.Meta.fields + ["reviews", "rating_breakdown", "related_books"]

    def get_reviews(self, obj):
        reviews = obj.reviews.select_related("user").all()[:10]
        return ReviewSerializer(reviews, many=True).data

    def get_rating_breakdown(self, obj):
        reviews = obj.reviews.all()
        total = reviews.count()
        if total == 0:
            return {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, "total": 0}
        counts = {i: 0 for i in range(1, 6)}
        for r in reviews:
            if 1 <= r.rating <= 5:
                counts[r.rating] += 1
        return {
            "total": total,
            "stars": {
                i: {
                    "count": counts[i],
                    "percentage": int(round((counts[i] / total) * 100)),
                } for i in range(1, 6)
            }
        }

    def get_related_books(self, obj):
        related = Book.objects.filter(is_published=True).filter(
            genre=obj.genre
        ).exclude(id=obj.id)[:6]
        return BookSerializer(related, many=True).data


class SubgenreSerializer(serializers.ModelSerializer):
    book_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Genre
        fields = ["id", "name", "slug", "description", "book_count"]


class GenreSerializer(serializers.ModelSerializer):
    book_count = serializers.IntegerField(read_only=True)
    subgenres = SubgenreSerializer(many=True, read_only=True)

    class Meta:
        model = Genre
        fields = ["id", "name", "slug", "description", "image_url", "parent", "is_featured", "display_order", "book_count", "subgenres"]


class AuthorSerializer(serializers.ModelSerializer):
    books = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ["id", "name", "slug", "biography", "portrait_url", "alternate_names", "is_featured", "books"]

    def get_books(self, obj):
        books = obj.books.filter(is_published=True)[:8]
        return BookSerializer(books, many=True).data


class PublisherSerializer(serializers.ModelSerializer):
    books = serializers.SerializerMethodField()

    class Meta:
        model = Publisher
        fields = ["id", "name", "slug", "about", "logo_url", "website", "books"]

    def get_books(self, obj):
        books = obj.books.filter(is_published=True)[:8]
        return BookSerializer(books, many=True).data
