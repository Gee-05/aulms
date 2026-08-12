"""
Sweeps active borrow records for overdue / due-soon items.

Not wired to a scheduler in this project. In production, run this on a
daily cron job (or Celery beat task):

    */30 * * * *  cd /path/to/backend && venv/bin/python manage.py update_overdue_status
"""

from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from borrowing.models import BorrowRecord
from notifications.models import Notification
from notifications.utils import notify


class Command(BaseCommand):
    help = "Marks past-due borrow records as overdue and sends due-soon / overdue reminders."

    def handle(self, *args, **options):
        today = timezone.now().date()

        overdue_qs = BorrowRecord.objects.select_related("book", "student").filter(
            status=BorrowRecord.Status.BORROWED, due_date__lt=today
        )
        overdue_count = 0
        for record in overdue_qs:
            record.status = BorrowRecord.Status.OVERDUE
            record.save(update_fields=["status"])
            record.book.refresh_status()
            days_overdue = (today - record.due_date).days
            notify(
                record.student,
                Notification.Type.OVERDUE,
                f'"{record.book.title}" is {days_overdue} day(s) overdue. Please return it as soon as possible.',
                "Overdue book reminder",
            )
            overdue_count += 1

        due_soon_cutoff = today + timedelta(days=settings.DUE_SOON_REMINDER_DAYS)
        due_soon_qs = BorrowRecord.objects.select_related("book", "student").filter(
            status=BorrowRecord.Status.BORROWED, due_date__gte=today, due_date__lte=due_soon_cutoff
        )
        due_soon_count = 0
        for record in due_soon_qs:
            notify(
                record.student,
                Notification.Type.DUE_SOON,
                f'"{record.book.title}" is due back on {record.due_date}.',
                "Book due soon",
            )
            due_soon_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Marked {overdue_count} record(s) overdue, sent {due_soon_count} due-soon reminder(s)."
            )
        )
