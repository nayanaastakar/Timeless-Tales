from rest_framework.test import APITestCase
from accounts.models import Reader, Address
from catalogue.models import Book, Genre, Review
from commerce.models import Coupon, Order, OrderItem
from content.models import BlogPost, FAQ


class TimelessTalesFeatureTests(APITestCase):
    def setUp(self):
        self.admin = Reader.objects.create_superuser(
            email="admin_test@timelesstales.com",
            name="Admin Tester",
            password="AdminPassword123"
        )
        self.reader = Reader.objects.create_user(
            email="reader_test@timelesstales.com",
            name="Reader Tester",
            password="ReaderPassword123"
        )
        self.genre = Genre.objects.create(name="Fiction", slug="fiction", is_featured=True)
        self.book = Book.objects.create(
            id="test-book-features",
            title="The Great Novel",
            author="Master Author",
            genre="Fiction",
            price="350.00",
            mrp="450.00",
            rating="4.8",
            year=2021,
            blurb="A grand story of modern India.",
            stock=15,
            is_bestseller=True,
            is_featured=True,
        )
        self.book.genres.add(self.genre)

        self.coupon = Coupon.objects.create(
            code="SAVE10",
            discount_percent=10,
            max_discount_amount="100.00",
            min_order_value="200.00",
            is_active=True,
        )

    def test_search_autocomplete_returns_suggestions_and_books(self):
        response = self.client.get("/api/v1/search/autocomplete/?q=Great")
        self.assertEqual(response.status_code, 200)
        self.assertIn("The Great Novel", response.data["suggestions"])
        self.assertEqual(len(response.data["books"]), 1)
        self.assertEqual(response.data["books"][0]["id"], "test-book-features")

    def test_department_mega_menu_endpoint(self):
        response = self.client.get("/api/v1/departments/")
        self.assertEqual(response.status_code, 200)
        names = [d["name"] for d in response.data]
        self.assertIn("Fiction", names)

    def test_recommendations_endpoint(self):
        response = self.client.get("/api/v1/recommendations/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("bestsellers", response.data)
        self.assertIn("today_deals", response.data)
        self.assertIn("top_rated", response.data)

    def test_coupon_validation(self):
        self.client.force_authenticate(self.reader)
        # Add book to cart first
        self.client.post("/api/v1/cart/items/", {"bookId": self.book.id, "quantity": 1}, format="json")

        response = self.client.post("/api/v1/coupons/apply/", {"code": "SAVE10"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["valid"])
        self.assertEqual(response.data["discountAmount"], 35.0)

    def test_review_submission_and_helpful_vote(self):
        self.client.force_authenticate(self.reader)
        # Post review
        rev_res = self.client.post(
            f"/api/v1/books/{self.book.id}/reviews/",
            {"rating": 5, "title": "Incredible read", "comment": "A true classic for the ages."},
            format="json"
        )
        self.assertEqual(rev_res.status_code, 201)
        review_id = rev_res.data["id"]

        # Vote helpful
        vote_res = self.client.post(f"/api/v1/reviews/{review_id}/vote/")
        self.assertEqual(vote_res.status_code, 200)
        self.assertEqual(vote_res.data["helpful_votes"], 1)

    def test_address_crud(self):
        self.client.force_authenticate(self.reader)
        create_res = self.client.post("/api/v1/addresses/", {
            "full_name": "Reader Tester",
            "phone": "+91 99999 88888",
            "street_address": "123 Test Street",
            "city": "Bengaluru",
            "state": "Karnataka",
            "postal_code": "560001",
            "country": "India",
            "is_default": True
        }, format="json")
        self.assertEqual(create_res.status_code, 201)
        addr_id = create_res.data["id"]

        list_res = self.client.get("/api/v1/addresses/")
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.data), 1)

    def test_admin_analytics_requires_admin(self):
        self.client.force_authenticate(self.reader)
        denied = self.client.get("/api/v1/admin/analytics/")
        self.assertEqual(denied.status_code, 403)

        self.client.force_authenticate(self.admin)
        allowed = self.client.get("/api/v1/admin/analytics/")
        self.assertEqual(allowed.status_code, 200)
        self.assertIn("metrics", allowed.data)
        self.assertIn("totalRevenue", allowed.data["metrics"])
