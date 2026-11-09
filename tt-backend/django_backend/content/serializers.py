from rest_framework import serializers

from .models import BlogPost, FAQ, NewsletterSubscriber, SupportTicket


class BlogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "summary", "content", "cover_image_url",
            "author_name", "category", "tags", "reading_time_minutes", "published_at"
        ]


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ["id", "category", "question", "answer", "display_order"]


class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = [
            "id", "name", "email", "subject", "category", "message",
            "status", "admin_response", "created_at"
        ]
        read_only_fields = ["id", "status", "admin_response", "created_at"]


class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ["id", "email", "subscribed_at"]
        read_only_fields = ["id", "subscribed_at"]
