from django.db import migrations
from django.utils.text import slugify


def _unique_slug(manager, value, identity):
    base = slugify(value)[:210] or "item"
    candidate = base
    suffix = 1
    while manager.filter(slug=candidate).exclude(pk=identity).exists():
        candidate = f"{base[:200]}-{suffix}"
        suffix += 1
    return candidate


def import_legacy_data(apps, schema_editor):
    connection = schema_editor.connection
    tables = set(connection.introspection.table_names())
    alias = connection.alias
    Book = apps.get_model("catalogue", "Book")
    Author = apps.get_model("catalogue", "Author")
    Genre = apps.get_model("catalogue", "Genre")
    Reader = apps.get_model("accounts", "Reader")
    Cart = apps.get_model("commerce", "Cart")
    CartItem = apps.get_model("commerce", "CartItem")
    Wishlist = apps.get_model("commerce", "Wishlist")
    WishlistItem = apps.get_model("commerce", "WishlistItem")
    Order = apps.get_model("commerce", "Order")
    OrderItem = apps.get_model("commerce", "OrderItem")
    imported_books = set()
    imported_users = set()

    with connection.cursor() as cursor:
        if "books" in tables:
            cursor.execute(
                "SELECT id, title, author, genre, price, mrp, rating, pub_year, blurb, hue, stock, created_at, updated_at FROM books"
            )
            for row in cursor.fetchall():
                (book_id, title, author_name, genre_name, price, mrp, rating, year, blurb,
                 hue, stock, created_at, updated_at) = row
                author, _ = Author.objects.using(alias).get_or_create(
                    name=author_name,
                    defaults={"slug": _unique_slug(Author.objects.using(alias), author_name, None)},
                )
                genre, _ = Genre.objects.using(alias).get_or_create(
                    name=genre_name,
                    defaults={"slug": _unique_slug(Genre.objects.using(alias), genre_name, None)},
                )
                book, created = Book.objects.using(alias).get_or_create(
                    id=book_id,
                    defaults={
                        "slug": _unique_slug(Book.objects.using(alias), title, book_id),
                        "title": title, "author": author_name, "genre": genre_name,
                        "price": price, "mrp": mrp, "rating": rating, "year": year,
                        "blurb": blurb, "hue": hue, "stock": stock, "is_published": True,
                    },
                )
                if created:
                    book.authors.add(author)
                    book.genres.add(genre)
                    Book.objects.using(alias).filter(pk=book_id).update(
                        created_at=created_at, updated_at=updated_at
                    )
                imported_books.add(book_id)

        if "users" in tables:
            cursor.execute(
                "SELECT id, name, email, password_hash, role, created_at, updated_at FROM users"
            )
            for user_id, name, email, password_hash, role, created_at, updated_at in cursor.fetchall():
                normalized_email = email.strip().lower()
                if Reader.objects.using(alias).filter(email=normalized_email).exclude(pk=user_id).exists():
                    continue
                reader, created = Reader.objects.using(alias).get_or_create(
                    id=user_id,
                    defaults={
                        "name": name, "email": normalized_email,
                        "password": f"bcrypt${password_hash}" if password_hash.startswith("$2") else password_hash,
                        "role": role, "is_active": True, "is_staff": role == "ADMIN",
                        "is_superuser": role == "ADMIN",
                    },
                )
                if created:
                    Reader.objects.using(alias).filter(pk=user_id).update(
                        created_at=created_at, updated_at=updated_at
                    )
                imported_users.add(user_id)

        if "carts" in tables:
            cursor.execute("SELECT id, user_id, created_at, updated_at FROM carts")
            for cart_id, user_id, created_at, updated_at in cursor.fetchall():
                if user_id not in imported_users:
                    continue
                cart, created = Cart.objects.using(alias).get_or_create(
                    id=cart_id, defaults={"user_id": user_id}
                )
                if created:
                    Cart.objects.using(alias).filter(pk=cart_id).update(
                        created_at=created_at, updated_at=updated_at
                    )

        if "cart_items" in tables:
            cursor.execute("SELECT id, cart_id, book_id, quantity, created_at, updated_at FROM cart_items")
            for item_id, cart_id, book_id, quantity, created_at, updated_at in cursor.fetchall():
                if cart_id in set(Cart.objects.using(alias).values_list("id", flat=True)) and book_id in imported_books:
                    item, created = CartItem.objects.using(alias).get_or_create(
                        id=item_id,
                        defaults={"cart_id": cart_id, "book_id": book_id, "quantity": quantity},
                    )
                    if created:
                        CartItem.objects.using(alias).filter(pk=item_id).update(
                            created_at=created_at, updated_at=updated_at
                        )

        if "wishlists" in tables:
            cursor.execute("SELECT id, user_id, created_at, updated_at FROM wishlists")
            for wishlist_id, user_id, created_at, updated_at in cursor.fetchall():
                if user_id not in imported_users:
                    continue
                wishlist, created = Wishlist.objects.using(alias).get_or_create(
                    id=wishlist_id, defaults={"user_id": user_id}
                )
                if created:
                    Wishlist.objects.using(alias).filter(pk=wishlist_id).update(
                        created_at=created_at, updated_at=updated_at
                    )

        if "wishlist_items" in tables:
            cursor.execute("SELECT id, wishlist_id, book_id, created_at FROM wishlist_items")
            for item_id, wishlist_id, book_id, created_at in cursor.fetchall():
                if book_id not in imported_books:
                    continue
                item, created = WishlistItem.objects.using(alias).get_or_create(
                    id=item_id, defaults={"wishlist_id": wishlist_id, "book_id": book_id}
                )
                if created:
                    WishlistItem.objects.using(alias).filter(pk=item_id).update(created_at=created_at)

        if "orders" in tables:
            cursor.execute("SELECT id, user_id, status, total, created_at FROM orders")
            for order_id, user_id, order_status, total, created_at in cursor.fetchall():
                if user_id not in imported_users:
                    continue
                order, created = Order.objects.using(alias).get_or_create(
                    id=order_id,
                    defaults={"user_id": user_id, "status": order_status, "total": total},
                )
                if created:
                    Order.objects.using(alias).filter(pk=order_id).update(created_at=created_at)

        if "order_items" in tables:
            cursor.execute(
                "SELECT id, order_id, book_id, title, author, quantity, unit_price, line_total FROM order_items"
            )
            for item_id, order_id, book_id, title, author, quantity, unit_price, line_total in cursor.fetchall():
                if book_id not in imported_books:
                    continue
                OrderItem.objects.using(alias).get_or_create(
                    id=item_id,
                    defaults={
                        "order_id": order_id, "book_id": book_id, "title": title, "author": author,
                        "quantity": quantity, "unit_price": unit_price, "line_total": line_total,
                    },
                )


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("catalogue", "0001_initial"),
        ("commerce", "0001_initial"),
    ]

    operations = [migrations.RunPython(import_legacy_data, migrations.RunPython.noop)]
