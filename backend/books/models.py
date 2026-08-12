import io

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.validators import FileExtensionValidator
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Book(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        PENDING = "pending", "Pending Request"
        RESERVED = "reserved", "Reserved"
        BORROWED = "borrowed", "Borrowed"
        OVERDUE = "overdue", "Overdue"
        LOST = "lost", "Lost"

    isbn = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="books"
    )
    description = models.TextField(blank=True)
    publisher = models.CharField(max_length=255, blank=True)
    publication_year = models.PositiveIntegerField(null=True, blank=True)
    total_copies = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)
    shelf_location = models.CharField(max_length=100, blank=True)
    cover_image = models.ImageField(upload_to="book_covers/", blank=True, null=True)
    ebook_file = models.FileField(
        upload_to="book_ebooks/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=["pdf"])],
        help_text="Optional PDF - lets patrons read the book online from its detail page.",
    )
    qr_code = models.ImageField(upload_to="book_qrcodes/", blank=True, null=True, editable=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return f"{self.title} ({self.isbn})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.qr_code:
            self._generate_qr_code()
            super().save(update_fields=["qr_code"])

    def _generate_qr_code(self):
        import qrcode

        qr_image = qrcode.make(f"ISBN:{self.isbn}|ID:{self.id}|TITLE:{self.title}")
        buffer = io.BytesIO()
        qr_image.save(buffer, format="PNG")
        self.qr_code.save(f"book_{self.id}_qr.png", ContentFile(buffer.getvalue()), save=False)

    def refresh_status(self):
        """Recomputes the aggregate status field from live borrowing/reservation state."""
        if self.status == self.Status.LOST:
            return

        from borrowing.models import BorrowRecord, BorrowRequest

        if self.available_copies <= 0:
            has_overdue = BorrowRecord.objects.filter(
                book=self, status=BorrowRecord.Status.OVERDUE
            ).exists()
            new_status = self.Status.OVERDUE if has_overdue else self.Status.BORROWED
        elif BorrowRequest.objects.filter(book=self, status=BorrowRequest.Status.PENDING).exists():
            new_status = self.Status.PENDING
        elif BookReservation.objects.filter(book=self, status=BookReservation.Status.ACTIVE).exists():
            new_status = self.Status.RESERVED
        else:
            new_status = self.Status.AVAILABLE

        if new_status != self.status:
            self.status = new_status
            self.save(update_fields=["status"])


class BookReservation(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        FULFILLED = "fulfilled", "Fulfilled"
        CANCELLED = "cancelled", "Cancelled"
        EXPIRED = "expired", "Expired"

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="reservations")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="book_reservations"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    reserved_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-reserved_at"]

    def __str__(self):
        return f"{self.student} reserved {self.book} ({self.status})"
