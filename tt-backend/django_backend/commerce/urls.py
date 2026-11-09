from django.urls import path

from .views import (
    AdminOrderListView, AdminOrderStatusView, CartItemMoveToWishlistView,
    CartItemView, CartItemsView, CartView, CheckoutView, CouponApplyView,
    OrderDetailView, OrderListView, OrderCancelView, OrderReturnView,
    UserLibraryView, WishlistItemView, WishlistView
)


urlpatterns = [
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/items/", CartItemsView.as_view(), name="cart-items"),
    path("cart/items/<uuid:item_id>/", CartItemView.as_view(), name="cart-item"),
    path("cart/items/<uuid:item_id>/move-to-wishlist/", CartItemMoveToWishlistView.as_view(), name="cart-item-move-wishlist"),
    path("wishlist/", WishlistView.as_view(), name="wishlist"),
    path("wishlist/<str:book_id>/", WishlistItemView.as_view(), name="wishlist-item"),
    path("coupons/apply/", CouponApplyView.as_view(), name="coupon-apply"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("orders/", OrderListView.as_view(), name="order-list"),
    path("orders/<uuid:order_id>/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/<uuid:order_id>/cancel/", OrderCancelView.as_view(), name="order-cancel"),
    path("orders/<uuid:order_id>/return/", OrderReturnView.as_view(), name="order-return"),
    path("library/", UserLibraryView.as_view(), name="user-library"),
    path("library/<uuid:item_id>/", UserLibraryView.as_view(), name="user-library-item"),
    path("admin/orders/", AdminOrderListView.as_view(), name="admin-order-list"),
    path("admin/orders/<uuid:order_id>/status/", AdminOrderStatusView.as_view(), name="admin-order-status"),
]
