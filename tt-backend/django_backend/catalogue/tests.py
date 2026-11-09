from rest_framework.test import APITestCase

from accounts.models import Reader
from commerce.models import Order, OrderItem
from .models import Book


class BookCatalogueApiTests(APITestCase):
    def setUp(self):
        Book.objects.create(
            id="api-test-book-a", title="A Mystery", author="Reader Author", genre="Mystery",
            price="100.00", mrp="150.00", rating="4.5", year=2020, blurb="A short mystery.",
            stock=5,
        )
        Book.objects.create(
            id="api-test-book-b", title="A Classic", author="Another Author", genre="Classics",
            price="200.00", mrp="200.00", rating="4.0", year=2019, blurb="A classic story.",
            stock=0,
        )

    def test_catalogue_search_filters_and_zero_based_pagination(self):
        response = self.client.get("/api/v1/books/?q=mystery&genre=Mystery&page=0&size=1")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["totalElements"], 1)
        self.assertEqual(response.data["number"], 0)
        self.assertEqual(response.data["content"][0]["id"], "api-test-book-a")

    def test_book_detail_keeps_existing_frontend_fields(self):
        response = self.client.get("/api/v1/books/api-test-book-a/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["author"], "Reader Author")
        self.assertEqual(response.data["price"], 100.0)
        self.assertEqual(response.data["stock"], 5)

    def test_popularity_uses_actual_order_units_and_discount_uses_percentage(self):
        reader = Reader.objects.create_user(email="popular@example.test", name="Reader")
        order = Order.objects.create(user=reader, total="1000.00")
        OrderItem.objects.create(
            order=order, book_id="api-test-book-b", title="A Classic", author="Another Author",
            quantity=5, unit_price="200.00", line_total="1000.00",
        )
        popular = self.client.get("/api/v1/books/?sort=popularity&page=0&size=2")
        discounts = self.client.get("/api/v1/books/?sort=discount&page=0&size=2")
        self.assertEqual(popular.data["content"][0]["id"], "api-test-book-b")
        self.assertEqual(discounts.data["content"][0]["id"], "api-test-book-a")
