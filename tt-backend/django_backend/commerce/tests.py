from rest_framework.test import APITestCase

from accounts.models import Reader
from catalogue.models import Book


class CommerceApiTests(APITestCase):
    def setUp(self):
        self.reader = Reader.objects.create_user(
            email="buyer@example.test", name="Buyer", password="StrongPass-2026"
        )
        self.book = Book.objects.create(
            id="api-commerce-book", title="Test Book", author="Test Author", genre="Classics",
            price="120.00", mrp="150.00", rating="4.0", year=2021, blurb="Test description.",
            stock=4,
        )
        self.client.force_authenticate(self.reader)

    def test_cart_wishlist_and_transactional_demo_order(self):
        added = self.client.post("/api/v1/cart/items/", {"bookId": self.book.id, "quantity": 2}, format="json")
        self.assertEqual(added.status_code, 200)
        self.assertEqual(added.data["total"], 240.0)
        cart_item_id = added.data["items"][0]["id"]

        self.client.post(f"/api/v1/wishlist/{self.book.id}/")
        self.assertEqual(len(self.client.get("/api/v1/wishlist/").data), 1)

        order = self.client.post("/api/v1/orders/")
        self.assertEqual(order.status_code, 201)
        self.assertEqual(order.data["total"], 240.0)
        self.book.refresh_from_db()
        self.assertEqual(self.book.stock, 2)
        self.assertEqual(self.client.get("/api/v1/cart/").data["items"], [])
        self.assertEqual(len(self.client.get("/api/v1/orders/").data), 1)

        other_reader = Reader.objects.create_user(
            email="other@example.test", name="Other", password="StrongPass-2026"
        )
        self.client.force_authenticate(other_reader)
        self.assertEqual(self.client.put(
            f"/api/v1/cart/items/{cart_item_id}/", {"quantity": 1}, format="json"
        ).status_code, 404)

    def test_checkout_rejects_insufficient_stock_without_partial_order(self):
        self.client.post("/api/v1/cart/items/", {"bookId": self.book.id, "quantity": 3}, format="json")
        self.book.stock = 1
        self.book.save(update_fields=["stock"])
        response = self.client.post("/api/v1/orders/")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.book.__class__.objects.get(pk=self.book.pk).stock, 1)
        self.assertEqual(self.client.get("/api/v1/orders/").data, [])
