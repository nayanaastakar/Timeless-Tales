from django.contrib import admin
from .models import Cart, CartItem, Coupon, Order, OrderItem, ReturnRequest, UserLibraryItem, Wishlist, WishlistItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("book", "title", "author", "format", "quantity", "unit_price", "line_total")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "status", "total", "payment_method", "payment_status", "created_at")
    list_filter = ("status", "payment_status", "delivery_speed", "created_at")
    search_fields = ("order_number", "user__email", "user__name", "tracking_number")
    inlines = [OrderItemInline]


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_percent", "max_discount_amount", "min_order_value", "times_used", "usage_limit", "is_active")
    list_filter = ("is_active",)
    search_fields = ("code", "description")


@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "user", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("order__order_number", "user__email", "reason")


@admin.register(UserLibraryItem)
class UserLibraryItemAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "format", "reading_status", "current_page", "purchased_at")
    list_filter = ("reading_status", "format")
    search_fields = ("user__email", "book__title")
