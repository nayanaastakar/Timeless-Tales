import uuid
from decimal import Decimal
from datetime import datetime, timedelta

from django.db import transaction
from rest_framework.generics import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from catalogue.models import Book
from catalogue.serializers import BookSerializer
from .models import Cart, CartItem, Coupon, Order, OrderItem, ReturnRequest, UserLibraryItem, Wishlist, WishlistItem
from .serializers import (
    AddItemSerializer, CartSerializer, CouponSerializer,
    OrderSerializer, UpdateItemSerializer, UserLibraryItemSerializer
)


FREE_SHIPPING_THRESHOLD = Decimal("499.00")
STANDARD_SHIPPING_FEE = Decimal("40.00")
EXPRESS_SHIPPING_FEE = Decimal("89.00")


def cart_response(cart):
    active_items = list(cart.items.filter(saved_for_later=False).select_related("book").prefetch_related("book__editions").order_by("created_at"))
    saved_items = list(cart.items.filter(saved_for_later=True).select_related("book").prefetch_related("book__editions").order_by("created_at"))

    subtotal = Decimal("0.00")
    for item in active_items:
        edition = item.book.editions.filter(format__iexact=item.selected_format).first()
        price = edition.price if edition else item.book.price
        subtotal += price * item.quantity

    shipping_fee = Decimal("0.00")
    total = subtotal

    return CartSerializer({
        "items": active_items,
        "savedForLater": saved_items,
        "subtotal": subtotal,
        "shippingFee": shipping_fee,
        "freeShippingThreshold": FREE_SHIPPING_THRESHOLD,
        "amountNeededForFreeShipping": max(Decimal("0.00"), FREE_SHIPPING_THRESHOLD - subtotal),
        "total": total,
    }).data


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(cart_response(cart))

    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.filter(saved_for_later=False).delete()
        return Response(cart_response(cart))


class CartItemsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        book = get_object_or_404(Book, pk=serializer.validated_data["bookId"], is_published=True)
        cart, _ = Cart.objects.get_or_create(user=request.user)
        fmt = serializer.validated_data.get("format", "Paperback")

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            book=book,
            selected_format=fmt,
            defaults={"quantity": serializer.validated_data["quantity"], "saved_for_later": False}
        )
        if not created:
            if item.saved_for_later:
                item.saved_for_later = False
            item.quantity += serializer.validated_data["quantity"]

        if item.quantity > 100:
            raise ValidationError({"quantity": "Cart quantity cannot exceed 100."})
        if item.quantity > book.stock:
            raise ValidationError({"detail": f"Only {book.stock} copies are available in stock."})

        item.save()
        return Response(cart_response(cart), status=status.HTTP_200_OK)


class CartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, item_id):
        serializer = UpdateItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item = get_object_or_404(CartItem.objects.select_related("book"), pk=item_id, cart=cart)

        if "quantity" in serializer.validated_data:
            qty = serializer.validated_data["quantity"]
            if qty > item.book.stock:
                raise ValidationError({"detail": f"Only {item.book.stock} copies are available."})
            item.quantity = qty

        if "saved_for_later" in serializer.validated_data:
            item.saved_for_later = serializer.validated_data["saved_for_later"]

        if "format" in serializer.validated_data:
            item.selected_format = serializer.validated_data["format"]

        item.save()
        return Response(cart_response(cart))

    def delete(self, request, item_id):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        item.delete()
        return Response(cart_response(cart))


class CartItemMoveToWishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        WishlistItem.objects.get_or_create(wishlist=wishlist, book=item.book)
        item.delete()
        return Response(cart_response(cart))


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        books = Book.objects.filter(wishlist_items__wishlist=wishlist, is_published=True).order_by("-wishlist_items__created_at")
        return Response(BookSerializer(books, many=True).data)


class WishlistItemView(APIView):
    permission_classes = [IsAuthenticated]

    def _response(self, user):
        wishlist, _ = Wishlist.objects.get_or_create(user=user)
        books = Book.objects.filter(wishlist_items__wishlist=wishlist, is_published=True).order_by("-wishlist_items__created_at")
        return Response(BookSerializer(books, many=True).data)

    def post(self, request, book_id):
        book = get_object_or_404(Book, pk=book_id, is_published=True)
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        WishlistItem.objects.get_or_create(wishlist=wishlist, book=book)
        return self._response(request.user)

    def delete(self, request, book_id):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        WishlistItem.objects.filter(wishlist=wishlist, book_id=book_id).delete()
        return self._response(request.user)


class CouponApplyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get("code", "").strip().upper()
        if getattr(request.user, "is_authenticated", False):
            cart, _ = Cart.objects.get_or_create(user=request.user)
            active_items = list(cart.items.filter(saved_for_later=False).select_related("book").prefetch_related("book__editions"))

            subtotal = Decimal("0.00")
            for item in active_items:
                edition = item.book.editions.filter(format__iexact=item.selected_format).first()
                price = edition.price if edition else item.book.price
                subtotal += price * item.quantity
        else:
            try:
                subtotal = Decimal(str(request.data.get("subtotal", 0)))
            except Exception:
                subtotal = Decimal("0.00")

        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            return Response({"valid": False, "message": "Invalid coupon code."}, status=status.HTTP_400_BAD_REQUEST)

        is_valid, msg = coupon.is_valid_for_amount(subtotal)
        if not is_valid:
            return Response({"valid": False, "message": msg}, status=status.HTTP_400_BAD_REQUEST)

        discount = coupon.calculate_discount(subtotal)
        return Response({
            "valid": True,
            "code": coupon.code,
            "discountPercent": coupon.discount_percent,
            "discountAmount": float(discount),
            "subtotal": float(subtotal),
            "netTotal": float(subtotal - discount),
            "message": f"Coupon {coupon.code} applied! You save ₹{discount:.2f}",
        })


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        active_items = list(cart.items.filter(saved_for_later=False).select_related("book").prefetch_related("book__editions"))

        if not active_items:
            raise ValidationError({"detail": "Your shopping cart is empty. Please add items to your cart before proceeding to checkout."})

        # Calculate Subtotal & Validate Inventory
        subtotal = Decimal("0.00")
        for item in active_items:
            book = Book.objects.select_for_update().get(pk=item.book.pk)
            if item.quantity > book.stock:
                raise ValidationError({"detail": f"Not enough stock for '{book.title}'. Only {book.stock} left."})
            edition = item.book.editions.filter(format__iexact=item.selected_format).first()
            unit_p = edition.price if edition else book.price
            subtotal += unit_p * item.quantity

        # Delivery speed
        delivery_speed = request.data.get("deliverySpeed", "Standard")
        if delivery_speed == "Express":
            shipping_fee = EXPRESS_SHIPPING_FEE
            est_days = 2
        else:
            shipping_fee = Decimal("0.00")
            est_days = 4

        # Coupon Validation
        coupon_code = request.data.get("couponCode", "").strip().upper()
        discount_amount = Decimal("0.00")
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code)
                is_valid, _ = coupon.is_valid_for_amount(subtotal)
                if is_valid:
                    discount_amount = coupon.calculate_discount(subtotal)
                    coupon.times_used += 1
                    coupon.save(update_fields=["times_used"])
            except Coupon.DoesNotExist:
                pass

        total = subtotal + shipping_fee - discount_amount

        # Shipping Address
        address_data = request.data.get("address", {})
        if not address_data or not address_data.get("full_name") or not address_data.get("street_address"):
            saved_addr = request.user.addresses.first() if hasattr(request.user, "addresses") else None
            if saved_addr:
                address_data = {
                    "full_name": saved_addr.full_name,
                    "phone": saved_addr.phone,
                    "street_address": saved_addr.street_address,
                    "city": saved_addr.city,
                    "state": saved_addr.state,
                    "postal_code": saved_addr.postal_code,
                }
            else:
                address_data = {
                    "full_name": request.user.name or "Valued Reader",
                    "phone": getattr(request.user, "phone", "") or "+91 99999 99999",
                    "street_address": "Default Delivery Location",
                    "city": "Bengaluru",
                    "state": "Karnataka",
                    "postal_code": "560001",
                }

        # Payment details
        payment_method = request.data.get("paymentMethod", "UPI")
        payment_id = f"PAY-{uuid.uuid4().hex[:12].upper()}"

        est_date = datetime.now() + timedelta(days=est_days)
        est_delivery_str = est_date.strftime("%A, %b %d by 8:00 PM")
        order_num = f"TT-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

        # Create Order
        order = Order.objects.create(
            order_number=order_num,
            user=request.user,
            status=Order.Status.CONFIRMED,
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            discount_amount=discount_amount,
            coupon_code=coupon_code,
            total=total,
            shipping_address=address_data,
            delivery_speed=delivery_speed,
            payment_method=payment_method,
            payment_status="PAID" if payment_method != "COD" else "PENDING",
            payment_id=payment_id,
            tracking_number=f"TRK-IND-{uuid.uuid4().hex[:10].upper()}",
            estimated_delivery=est_delivery_str,
        )

        # Create OrderItems and Deduct Inventory
        for item in active_items:
            book = Book.objects.get(pk=item.book.pk)
            edition = item.book.editions.filter(format__iexact=item.selected_format).first()
            unit_p = edition.price if edition else book.price
            line_tot = unit_p * item.quantity

            OrderItem.objects.create(
                order=order,
                book=book,
                title=book.title,
                author=book.author,
                format=item.selected_format,
                cover_url=book.cover_url,
                quantity=item.quantity,
                unit_price=unit_p,
                line_total=line_tot,
            )

            # Deduct stock
            book.stock = max(0, book.stock - item.quantity)
            book.save(update_fields=["stock"])

            # Add to user's personal digital library
            UserLibraryItem.objects.get_or_create(
                user=request.user,
                book=book,
                defaults={"format": item.selected_format, "reading_status": UserLibraryItem.ReadingStatus.UNREAD}
            )

        # Clear active cart items
        cart.items.filter(saved_for_later=False).delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related("items", "returns").order_by("-created_at")
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        return CheckoutView().post(request)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        order = get_object_or_404(
            Order.objects.prefetch_related("items", "returns"),
            user=request.user,
            pk=order_id
        )
        return Response(OrderSerializer(order).data)


class OrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):
        order = get_object_or_404(Order, user=request.user, pk=order_id)
        if order.status not in (Order.Status.CONFIRMED, Order.Status.PROCESSING):
            return Response({"error": "This order cannot be cancelled as it is already being shipped or completed."}, status=status.HTTP_400_BAD_REQUEST)

        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])

        # Restock inventory
        for item in order.items.all():
            item.book.stock += item.quantity
            item.book.save(update_fields=["stock"])

        return Response(OrderSerializer(order).data)


class OrderReturnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        order = get_object_or_404(Order, user=request.user, pk=order_id)
        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response({"error": "Return reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        ret, created = ReturnRequest.objects.get_or_create(
            order=order,
            user=request.user,
            defaults={"reason": reason, "status": ReturnRequest.ReturnStatus.REQUESTED}
        )
        order.status = Order.Status.RETURN_REQUESTED
        order.save(update_fields=["status"])

        return Response(OrderSerializer(order).data)


class UserLibraryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        library_items = UserLibraryItem.objects.filter(user=request.user).select_related("book").order_by("-purchased_at")
        return Response(UserLibraryItemSerializer(library_items, many=True).data)

    def put(self, request, item_id):
        item = get_object_or_404(UserLibraryItem, pk=item_id, user=request.user)
        if "reading_status" in request.data:
            item.reading_status = request.data["reading_status"]
        if "current_page" in request.data:
            item.current_page = int(request.data["current_page"])
        if "notes" in request.data:
            item.notes = request.data["notes"]
        item.save()
        return Response(UserLibraryItemSerializer(item).data)


class AdminOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = Order.objects.select_related("user").prefetch_related("items", "returns").order_by("-created_at")[:50]
        return Response(OrderSerializer(orders, many=True).data)


class AdminOrderStatusView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, order_id):
        order = get_object_or_404(Order, pk=order_id)
        new_status = request.data.get("status")
        if new_status in Order.Status.values:
            order.status = new_status
            order.save(update_fields=["status", "updated_at"])
            return Response(OrderSerializer(order).data)
        return Response({"error": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)
