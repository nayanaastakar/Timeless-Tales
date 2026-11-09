from django.db.models import Count, Sum
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Reader
from catalogue.models import Book, Review
from commerce.models import Order, OrderItem, ReturnRequest
from .models import BlogPost, FAQ, NewsletterSubscriber, SupportTicket
from .serializers import (
    BlogPostSerializer, FAQSerializer, NewsletterSerializer, SupportTicketSerializer
)


class BlogPostListView(generics.ListAPIView):
    serializer_class = BlogPostSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = BlogPost.objects.filter(is_published=True)
        cat = self.request.query_params.get("category")
        if cat:
            qs = qs.filter(category__iexact=cat)
        return qs.order_by("-published_at")


class BlogPostDetailView(generics.RetrieveAPIView):
    serializer_class = BlogPostSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    queryset = BlogPost.objects.filter(is_published=True)


class FAQListView(generics.ListAPIView):
    serializer_class = FAQSerializer
    permission_classes = [AllowAny]
    queryset = FAQ.objects.filter(is_active=True).order_by("category", "display_order")


class SupportTicketListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        if request.user.role == "ADMIN":
            tickets = SupportTicket.objects.all().order_by("-created_at")
        else:
            tickets = SupportTicket.objects.filter(user=request.user).order_by("-created_at")
        return Response(SupportTicketSerializer(tickets, many=True).data)

    def post(self, request):
        serializer = SupportTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = SupportTicket.objects.create(
            user=request.user if request.user.is_authenticated else None,
            name=serializer.validated_data["name"],
            email=serializer.validated_data["email"],
            subject=serializer.validated_data["subject"],
            category=serializer.validated_data.get("category", "General"),
            message=serializer.validated_data["message"],
        )
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class NewsletterSubscribeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email or "@" not in email:
            return Response({"error": "Please provide a valid email address."}, status=status.HTTP_400_BAD_REQUEST)

        sub, created = NewsletterSubscriber.objects.get_or_create(email=email, defaults={"is_active": True})
        return Response({"message": "Thank you for subscribing to Timeless Tales! Check your inbox soon."}, status=status.HTTP_200_OK)


class AdminAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_revenue = Order.objects.exclude(status=Order.Status.CANCELLED).aggregate(s=Sum("total"))["s"] or 0
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status__in=[Order.Status.CONFIRMED, Order.Status.PROCESSING]).count()
        total_customers = Reader.objects.filter(role=Reader.Role.CUSTOMER).count()
        total_books = Book.objects.filter(is_published=True).count()
        low_stock_books = Book.objects.filter(stock__lte=5, is_published=True).values("id", "title", "stock", "price")
        return_requests = ReturnRequest.objects.filter(status=ReturnRequest.ReturnStatus.REQUESTED).count()
        recent_orders = Order.objects.select_related("user").order_by("-created_at")[:8]

        # Top selling books by units
        top_sellers = OrderItem.objects.values("title", "book_id").annotate(
            units_sold=Sum("quantity"),
            revenue=Sum("line_total")
        ).order_by("-units_sold")[:5]

        # Category performance
        category_stats = Book.objects.filter(is_published=True).values("genre").annotate(
            count=Count("id")
        ).order_by("-count")[:6]

        from commerce.serializers import OrderSerializer

        return Response({
            "metrics": {
                "totalRevenue": float(total_revenue),
                "totalOrders": total_orders,
                "pendingOrders": pending_orders,
                "totalCustomers": total_customers,
                "totalBooks": total_books,
                "returnRequests": return_requests,
                "lowStockCount": low_stock_books.count(),
            },
            "lowStockBooks": list(low_stock_books),
            "topSellers": list(top_sellers),
            "categoryBreakdown": list(category_stats),
            "recentOrders": OrderSerializer(recent_orders, many=True).data,
        })
