from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        REQUEST_APPROVED = "request_approved", "Request Approved"
        REQUEST_REJECTED = "request_rejected", "Request Rejected"
        DUE_SOON = "due_soon", "Due Soon"
        OVERDUE = "overdue", "Overdue"
        RETURNED = "returned", "Returned"
        RENEWAL_APPROVED = "renewal_approved", "Renewal Approved"
        RENEWAL_REJECTED = "renewal_rejected", "Renewal Rejected"
        FINE_ISSUED = "fine_issued", "Fine Issued"
        GENERAL = "general", "General"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=30, choices=Type.choices, default=Type.GENERAL)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.type}"
