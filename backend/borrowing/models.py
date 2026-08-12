from django.conf import settings
from django.db import models


class BorrowRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="borrow_requests"
    )
    book = models.ForeignKey("books.Book", on_delete=models.CASCADE, related_name="borrow_requests")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    request_date = models.DateTimeField(auto_now_add=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_requests",
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    borrow_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-request_date"]

    def __str__(self):
        return f"{self.student} -> {self.book} ({self.status})"


class BorrowRecord(models.Model):
    class Status(models.TextChoices):
        BORROWED = "borrowed", "Borrowed"
        RETURNED = "returned", "Returned"
        OVERDUE = "overdue", "Overdue"
        LOST = "lost", "Lost"

    class RenewalStatus(models.TextChoices):
        NONE = "", "None"
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    request = models.OneToOneField(
        BorrowRequest, on_delete=models.CASCADE, related_name="record"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="borrow_records"
    )
    book = models.ForeignKey("books.Book", on_delete=models.CASCADE, related_name="borrow_records")
    borrow_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BORROWED)
    renewal_count = models.PositiveIntegerField(default=0)
    renewal_requested = models.BooleanField(default=False)
    renewal_status = models.CharField(
        max_length=20, choices=RenewalStatus.choices, default=RenewalStatus.NONE, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student} - {self.book} ({self.status})"


class Fine(models.Model):
    record = models.ForeignKey(BorrowRecord, on_delete=models.CASCADE, related_name="fines")
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    reason = models.CharField(max_length=255, blank=True)
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Fine {self.amount} for {self.record} ({'paid' if self.is_paid else 'unpaid'})"
