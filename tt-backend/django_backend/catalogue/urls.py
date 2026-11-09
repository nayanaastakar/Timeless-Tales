from django.urls import path

from .views import (
    AuthorDetailView, AuthorListView, BookDetailView, BookListView,
    GenreListView, PublisherDetailView, PublisherListView,
    SearchAutocompleteView, DepartmentMegaMenuView, BookReviewListCreateView,
    ReviewVoteView, RecentlyViewedView, RecommendationsView, BookImportView
)


urlpatterns = [
    path("books/", BookListView.as_view(), name="book-list"),
    path("books/<str:id>/", BookDetailView.as_view(), name="book-detail"),
    path("books/<str:book_id>/reviews/", BookReviewListCreateView.as_view(), name="book-reviews"),
    path("reviews/<uuid:review_id>/vote/", ReviewVoteView.as_view(), name="review-vote"),
    path("search/autocomplete/", SearchAutocompleteView.as_view(), name="search-autocomplete"),
    path("departments/", DepartmentMegaMenuView.as_view(), name="department-mega-menu"),
    path("genres/", GenreListView.as_view(), name="genre-list"),
    path("authors/", AuthorListView.as_view(), name="author-list"),
    path("authors/<slug:slug>/", AuthorDetailView.as_view(), name="author-detail"),
    path("publishers/", PublisherListView.as_view(), name="publisher-list"),
    path("publishers/<slug:slug>/", PublisherDetailView.as_view(), name="publisher-detail"),
    path("recently-viewed/", RecentlyViewedView.as_view(), name="recently-viewed"),
    path("recommendations/", RecommendationsView.as_view(), name="recommendations"),
    path("admin/import-book/", BookImportView.as_view(), name="admin-import-book"),
]
