from rest_framework.test import APITestCase
from bcrypt import gensalt, hashpw
from django.contrib.auth.hashers import check_password

from .models import Reader


class AccountApiTests(APITestCase):
    def test_registration_login_and_me_return_safe_user(self):
        registration = self.client.post("/api/v1/auth/register/", {
            "name": "Reader One",
            "email": "Reader@Example.test",
            "password": "StrongPass-2026",
        })
        self.assertEqual(registration.status_code, 201)
        self.assertEqual(registration.data["user"]["email"], "reader@example.test")
        self.assertNotIn("password", registration.data["user"])
        self.assertNotIn("password_hash", registration.data["user"])

        login = self.client.post("/api/v1/auth/login/", {
            "email": "reader@example.test",
            "password": "StrongPass-2026",
        })
        self.assertEqual(login.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['token']}")
        me = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["id"], str(Reader.objects.get().id))

    def test_registration_rejects_duplicate_email_and_short_password(self):
        Reader.objects.create_user(email="reader@example.test", name="Reader", password="StrongPass-2026")
        duplicate = self.client.post("/api/v1/auth/register/", {
            "name": "Another Reader", "email": "READER@example.test", "password": "StrongPass-2026",
        })
        short_password = self.client.post("/api/v1/auth/register/", {
            "name": "A Reader", "email": "another@example.test", "password": "short",
        })
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(short_password.status_code, 400)

    def test_java_bcrypt_hashes_are_verifiable_after_migration(self):
        old_hash = hashpw(b"OldJavaPassword", gensalt()).decode("ascii")
        reader = Reader.objects.create(
            name="Legacy Reader", email="legacy@example.test", password=f"bcrypt${old_hash}"
        )
        self.assertTrue(check_password("OldJavaPassword", reader.password))

    def test_admin_can_list_readers_and_render_add_form(self):
        admin = Reader.objects.create_superuser(
            email="admin@example.test", name="Store Admin", password="StrongPass-2026"
        )
        self.client.force_login(admin)
        self.assertEqual(self.client.get("/admin/accounts/reader/").status_code, 200)
        self.assertEqual(self.client.get("/admin/accounts/reader/add/").status_code, 200)
