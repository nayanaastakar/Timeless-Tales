from rest_framework import serializers

from catalogue.serializers import BookSerializer
from .models import CartItem, Coupon, Order, OrderItem, ReturnRequest, UserLibraryItem


class CartItemSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    unitPrice = serializers.SerializerMethodField()
    lineTotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "book", "quantity", "selected_format", "saved_for_later", "unitPrice", "lineTotal"]

    def get_unitPrice(self, item):
        # If edition exists for this format, use edition price, otherwise book price
        edition = item.book.editions.filter(format__iexact=item.selected_format).first()
        if edition:
            return float(edition.price)
        return float(item.book.price)

    def get_lineTotal(self, item):
        return self.get_unitPrice(item) * item.quantity


class CartSerializer(serializers.Serializer):
    items = CartItemSerializer(many=True)
    savedForLater = CartItemSerializer(many=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    shippingFee = serializers.DecimalField(max_digits=8, decimal_places=2)
    freeShippingThreshold = serializers.DecimalField(max_digits=8, decimal_places=2)
    amountNeededForFreeShipping = serializers.DecimalField(max_digits=8, decimal_places=2)
    total = serializers.DecimalField(max_digits=12, decimal_places=2)


class AddItemSerializer(serializers.Serializer):
    bookId = serializers.CharField(max_length=80)
    quantity = serializers.IntegerField(min_value=1, max_value=100, default=1)
    format = serializers.CharField(max_length=30, default="Paperback")


class UpdateItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=100, required=False)
    saved_for_later = serializers.BooleanField(required=False)
    format = serializers.CharField(max_length=30, required=False)


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ["id", "code", "discount_percent", "max_discount_amount", "min_order_value", "description"]


class OrderItemSerializer(serializers.ModelSerializer):
    unitPrice = serializers.DecimalField(source="unit_price", max_digits=10, decimal_places=2)
    lineTotal = serializers.DecimalField(source="line_total", max_digits=12, decimal_places=2)

    class Meta:
        model = OrderItem
        fields = ["id", "title", "author", "format", "cover_url", "quantity", "unitPrice", "lineTotal"]


class ReturnRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnRequest
        fields = ["id", "order", "reason", "status", "admin_response", "created_at"]
        read_only_fields = ["id", "status", "admin_response", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    orderNumber = serializers.CharField(source="order_number")
    createdAt = serializers.DateTimeField(source="created_at")
    shippingFee = serializers.DecimalField(source="shipping_fee", max_digits=8, decimal_places=2)
    discountAmount = serializers.DecimalField(source="discount_amount", max_digits=8, decimal_places=2)
    couponCode = serializers.CharField(source="coupon_code")
    shippingAddress = serializers.JSONField(source="shipping_address")
    deliverySpeed = serializers.CharField(source="delivery_speed")
    paymentMethod = serializers.CharField(source="payment_method")
    paymentStatus = serializers.CharField(source="payment_status")
    trackingNumber = serializers.CharField(source="tracking_number")
    estimatedDelivery = serializers.CharField(source="estimated_delivery")
    items = OrderItemSerializer(many=True)
    returns = ReturnRequestSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "orderNumber", "status", "subtotal", "shippingFee", "discountAmount",
            "couponCode", "total", "shippingAddress", "deliverySpeed", "paymentMethod",
            "paymentStatus", "trackingNumber", "estimatedDelivery", "createdAt", "items", "returns"
        ]


class UserLibraryItemSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)

    class Meta:
        model = UserLibraryItem
        fields = ["id", "book", "format", "reading_status", "current_page", "notes", "purchased_at"]
