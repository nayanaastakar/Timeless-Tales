import uuid
from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="subgenres")
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Author(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True)
    biography = models.TextField(blank=True)
    portrait_url = models.URLField(blank=True)
    alternate_names = models.JSONField(default=list, blank=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Publisher(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True)
    about = models.TextField(blank=True)
    logo_url = models.URLField(blank=True)
    website = models.URLField(blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Book(models.Model):
    class Format(models.TextChoices):
        PAPERBACK = "PAPERBACK", "Paperback"
        HARDCOVER = "HARDCOVER", "Hardcover"
        EBOOK = "EBOOK", "Kindle / eBook"
        AUDIOBOOK = "AUDIOBOOK", "Audiobook"

    id = models.CharField(max_length=80, primary_key=True)
    slug = models.SlugField(max_length=240, unique=True, blank=True)
    title = models.CharField(max_length=200, db_index=True)
    subtitle = models.CharField(max_length=250, blank=True)
    author = models.CharField(max_length=150, db_index=True)
    authors = models.ManyToManyField(Author, blank=True, related_name="books")
    genre = models.CharField(max_length=60, db_index=True)
    genres = models.ManyToManyField(Genre, blank=True, related_name="books")
    publisher = models.ForeignKey(Publisher, null=True, blank=True, on_delete=models.SET_NULL, related_name="books")
    publisher_name = models.CharField(max_length=200, blank=True, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    review_count = models.PositiveIntegerField(default=0)
    year = models.IntegerField(db_column="pub_year")
    blurb = models.TextField()
    description = models.TextField(blank=True)
    hue = models.PositiveSmallIntegerField(default=0)
    stock = models.PositiveIntegerField(default=20)
    isbn10 = models.CharField(max_length=10, blank=True, null=True, unique=True)
    isbn13 = models.CharField(max_length=13, blank=True, null=True, unique=True)
    language = models.CharField(max_length=35, blank=True, default="English", db_index=True)
    page_count = models.PositiveIntegerField(null=True, blank=True)
    format = models.CharField(max_length=20, choices=Format.choices, default=Format.PAPERBACK)
    cover_url = models.URLField(max_length=1000, blank=True)
    cover = models.ImageField(upload_to="book-covers/", blank=True)
    source = models.CharField(max_length=40, blank=True)
    source_id = models.CharField(max_length=180, blank=True)
    is_published = models.BooleanField(default=True, db_index=True)
    is_bestseller = models.BooleanField(default=False, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    is_new_release = models.BooleanField(default=False, db_index=True)
    deal_discount = models.PositiveSmallIntegerField(default=0, db_index=True)
    reading_age = models.CharField(max_length=50, blank=True)
    dimensions = models.CharField(max_length=100, blank=True)
    weight = models.CharField(max_length=50, blank=True)
    sample_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]
        indexes = [
            models.Index(fields=["is_published", "genre"]),
            models.Index(fields=["is_published", "price"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["is_bestseller"]),
            models.Index(fields=["is_featured"]),
            models.Index(fields=["is_new_release"]),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(price__gte=0), name="tt_book_price_nonnegative"),
            models.CheckConstraint(condition=models.Q(mrp__gte=models.F("price")), name="tt_book_mrp_gte_price"),
            models.CheckConstraint(condition=models.Q(rating__gte=0, rating__lte=5), name="tt_book_rating_range"),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:220] or self.id
        super().save(*args, **kwargs)

    def recalculate_ratings(self):
        reviews = self.reviews.all()
        count = reviews.count()
        if count == 0:
            self.rating = 0.0
            self.review_count = 0
        else:
            total = sum(r.rating for r in reviews)
            self.rating = round(total / count, 2)
            self.review_count = count
        self.save(update_fields=["rating", "review_count"])

    def __str__(self):
        return self.title


class BookEdition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="editions")
    format = models.CharField(max_length=20, choices=Book.Format.choices)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    isbn10 = models.CharField(max_length=10, blank=True)
    isbn13 = models.CharField(max_length=13, blank=True)
    stock = models.PositiveIntegerField(default=10)
    page_count = models.PositiveIntegerField(null=True, blank=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        unique_together = ("book", "format")
        ordering = ["price"]

    def __str__(self):
        return f"{self.book.title} ({self.get_format_display()}) - ₹{self.price}"


class BookImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="images")
    image_url = models.URLField(max_length=1000)
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField()  # 1 to 5
    title = models.CharField(max_length=200)
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    helpful_votes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["book", "user"], name="tt_unique_book_review_per_user")
        ]

    def __str__(self):
        return f"{self.rating}★: {self.title} by {self.user.name}"


class ReviewVote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="review_votes")
    is_helpful = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["review", "user"], name="tt_unique_review_vote_per_user")
        ]


class RecentlyViewed(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="recently_viewed")
    session_id = models.CharField(max_length=100, blank=True)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="view_records")
    viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-viewed_at"]
