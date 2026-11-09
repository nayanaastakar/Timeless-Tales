from django.contrib import admin
from .models import BlogPost, FAQ, NewsletterSubscriber, SupportTicket


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "author_name", "reading_time_minutes", "is_published", "published_at")
    list_filter = ("category", "is_published", "published_at")
    search_fields = ("title", "summary", "content", "tags")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ("question", "category", "display_order", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("question", "answer")


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("subject", "user", "name", "email", "category", "status", "created_at")
    list_filter = ("status", "category", "created_at")
    search_fields = ("subject", "message", "email", "name")


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "is_active", "subscribed_at")
    list_filter = ("is_active", "subscribed_at")
    search_fields = ("email",)
