from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    """Audit trail of significant actions taken across the system."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        who = self.user.username if self.user else "system"
        return f"{who} - {self.action} - {self.timestamp:%Y-%m-%d %H:%M}"


class LibraryPolicy(models.Model):
    """
    Singleton, admin-editable borrowing policy. Read at runtime by
    borrowing/services.py instead of hardcoded settings, so an Administrator
    can change loan durations / fine rates from the app without a redeploy.
    Field defaults mirror the original settings.py values.
    """

    loan_period_days = models.PositiveIntegerField(
        default=14, help_text="Default loan period for student members."
    )
    faculty_loan_period_days = models.PositiveIntegerField(
        default=30, help_text="Loan period for faculty members."
    )
    guest_loan_period_days = models.PositiveIntegerField(
        default=7, help_text="Loan period for guest members."
    )
    max_active_loans_student = models.PositiveIntegerField(default=5)
    max_active_loans_faculty = models.PositiveIntegerField(default=10)
    max_active_loans_guest = models.PositiveIntegerField(default=3)
    fine_per_day = models.DecimalField(max_digits=6, decimal_places=2, default=0.50)
    max_renewals = models.PositiveIntegerField(default=1)
    renewal_period_days = models.PositiveIntegerField(default=7)
    due_soon_reminder_days = models.PositiveIntegerField(default=2)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Library policy"
        verbose_name_plural = "Library policy"

    def __str__(self):
        return "Library borrowing policy"

    @classmethod
    def current(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def loan_period_for(self, membership_type):
        return {
            "faculty": self.faculty_loan_period_days,
            "guest": self.guest_loan_period_days,
        }.get(membership_type, self.loan_period_days)

    def max_active_loans_for(self, membership_type):
        return {
            "faculty": self.max_active_loans_faculty,
            "guest": self.max_active_loans_guest,
        }.get(membership_type, self.max_active_loans_student)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)
