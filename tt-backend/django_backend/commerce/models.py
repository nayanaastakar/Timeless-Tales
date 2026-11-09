import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

from catalogue.models import Book


class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.PositiveSmallIntegerField(default=10)
    max_discount_amount = models.DecimalField(max_digits=8, decimal_places=2, default=500.00)
    min_order_value = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    usage_limit = models.PositiveIntegerField(default=1000)
    times_used = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    description = models.CharField(max_length=255, blank=True)

    def is_valid_for_amount(self, amount):
        if not self.is_active:
            return False, "This coupon is not active."
        if self.times_used >= self.usage_limit:
            return False, "This coupon has reached its usage limit."
        now = timezone.now()
        if self.valid_from and now < self.valid_from:
            return False, "This coupon is not yet valid."
        if self.valid_until and now > self.valid_until:
            return False, "This coupon has expired."
        if amount < self.min_order_value:
            return False, f"Minimum order value of ₹{self.min_order_value} is required."
        return True, "Coupon applied successfully."

    def calculate_discount(self, amount):
        discount = (amount * self.discount_percent) / 100
        return min(discount, self.max_discount_amount)

    def __str__(self):
        return f"{self.code} ({self.discount_percent}% off)"


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name="cart_items")
    quantity = models.PositiveSmallIntegerField()
    selected_format = models.CharField(max_length=30, default="Paperback")
    saved_for_later = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["cart", "book", "selected_format"], name="tt_cart_book_format_unique"),
            models.CheckConstraint(condition=models.Q(quantity__gte=1, quantity__lte=100), name="tt_cart_quantity_range"),
        ]


class Wishlist(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class WishlistItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name="items")
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="wishlist_items")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["wishlist", "book"], name="tt_wishlist_book_unique")]


class Order(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = "CONFIRMED", "Order Confirmed"
        PROCESSING = "PROCESSING", "Processing"
        PACKED = "PACKED", "Packed"
        SHIPPED = "SHIPPED", "Shipped"
        OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for Delivery"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"
        RETURN_REQUESTED = "RETURN_REQUESTED", "Return Requested"
        RETURNED = "RETURNED", "Returned"
        REFUNDED = "REFUNDED", "Refunded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=40, default="", blank=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.CONFIRMED)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    coupon_code = models.CharField(max_length=50, blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_address = models.JSONField(default=dict, blank=True)
    delivery_speed = models.CharField(max_length=30, default="Standard")
    payment_method = models.CharField(max_length=30, default="UPI")
    payment_status = models.CharField(max_length=30, default="PAID")
    payment_id = models.CharField(max_length=100, blank=True)
    tracking_number = models.CharField(max_length=50, blank=True)
    estimated_delivery = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"TT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_number} ({self.status}) - ₹{self.total}"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name="order_items")
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=150)
    format = models.CharField(max_length=30, default="Paperback")
    cover_url = models.URLField(max_length=1000, blank=True)
    quantity = models.PositiveSmallIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)


class ReturnRequest(models.Model):
    class ReturnStatus(models.TextChoices):
        REQUESTED = "REQUESTED", "Requested"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        COMPLETED = "COMPLETED", "Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="returns")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reason = models.TextField()
    status = models.CharField(max_length=30, choices=ReturnStatus.choices, default=ReturnStatus.REQUESTED)
    admin_response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class UserLibraryItem(models.Model):
    class ReadingStatus(models.TextChoices):
        UNREAD = "UNREAD", "Want to Read"
        READING = "READING", "Currently Reading"
        FINISHED = "FINISHED", "Finished"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="library_books")
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="library_entries")
    format = models.CharField(max_length=30, default="eBook")
    reading_status = models.CharField(max_length=30, choices=ReadingStatus.choices, default=ReadingStatus.UNREAD)
    current_page = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "book")
        ordering = ["-purchased_at"]
