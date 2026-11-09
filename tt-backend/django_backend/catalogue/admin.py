from django.contrib import admin
from .models import Author, Book, BookEdition, BookImage, Genre, Publisher, RecentlyViewed, Review, ReviewVote


class BookEditionInline(admin.TabularInline):
    model = BookEdition
    extra = 1


class BookImageInline(admin.TabularInline):
    model = BookImage
    extra = 1


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "genre", "price", "mrp", "rating", "stock", "is_published", "is_bestseller", "is_featured", "is_new_release")
    list_filter = ("is_published", "is_bestseller", "is_featured", "is_new_release", "genre", "format")
    search_fields = ("title", "author", "isbn10", "isbn13", "publisher_name")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [BookEditionInline, BookImageInline]


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "is_featured", "display_order", "is_active")
    list_filter = ("is_active", "is_featured")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("name", "is_featured")
    search_fields = ("name", "biography")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
    list_display = ("name", "website")
    search_fields = ("name", "about")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("book", "user", "rating", "title", "is_verified_purchase", "helpful_votes", "created_at")
    list_filter = ("rating", "is_verified_purchase", "created_at")
    search_fields = ("title", "comment", "book__title", "user__email")


@admin.register(BookEdition)
class BookEditionAdmin(admin.ModelAdmin):
    list_display = ("book", "format", "price", "mrp", "stock", "is_available")
    list_filter = ("format", "is_available")
