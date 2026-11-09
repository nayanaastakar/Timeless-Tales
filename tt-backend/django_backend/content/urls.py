from django.urls import path

from .views import (
    AdminAnalyticsView, BlogPostDetailView, BlogPostListView, FAQListView,
    NewsletterSubscribeView, SupportTicketListCreateView
)


urlpatterns = [
    path("blogs/", BlogPostListView.as_view(), name="blog-list"),
    path("blogs/<slug:slug>/", BlogPostDetailView.as_view(), name="blog-detail"),
    path("faqs/", FAQListView.as_view(), name="faq-list"),
    path("support/tickets/", SupportTicketListCreateView.as_view(), name="support-tickets"),
    path("newsletter/subscribe/", NewsletterSubscribeView.as_view(), name="newsletter-subscribe"),
    path("admin/analytics/", AdminAnalyticsView.as_view(), name="admin-analytics"),
]
