from datetime import timedelta

from django.core.exceptions import PermissionDenied
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from borrowing.models import BorrowRecord, BorrowRequest, Fine
from core.models import LibraryPolicy
from core.utils import log_activity
from notifications.models import Notification
from notifications.utils import notify


def _membership_type(student):
    profile = getattr(student, "student_profile", None)
    return profile.membership_type if profile else "student"


def _active_loan_count(student):
    return BorrowRecord.objects.filter(
        student=student, status__in=[BorrowRecord.Status.BORROWED, BorrowRecord.Status.OVERDUE]
    ).count()


def approve_request(borrow_request, librarian, due_date=None):
    if borrow_request.status != BorrowRequest.Status.PENDING:
        raise ValidationError("Only pending requests can be approved.")

    book = borrow_request.book
    if book.available_copies <= 0:
        raise ValidationError("No available copies left for this book.")

    student = borrow_request.student
    policy = LibraryPolicy.current()
    membership_type = _membership_type(student)

    active_loans = _active_loan_count(student)
    max_loans = policy.max_active_loans_for(membership_type)
    if active_loans >= max_loans:
        raise ValidationError(
            f"{student.get_full_name() or student.username} already has {active_loans} active loan(s), "
            f"the maximum allowed for a {membership_type} member ({max_loans})."
        )

    borrow_date = timezone.now().date()
    due = due_date or (borrow_date + timedelta(days=policy.loan_period_for(membership_type)))

    borrow_request.status = BorrowRequest.Status.APPROVED
    borrow_request.processed_by = librarian
    borrow_request.processed_at = timezone.now()
    borrow_request.borrow_date = borrow_date
    borrow_request.due_date = due
    borrow_request.save()

    book.available_copies -= 1
    book.save(update_fields=["available_copies"])

    record = BorrowRecord.objects.create(
        request=borrow_request,
        student=student,
        book=book,
        borrow_date=borrow_date,
        due_date=due,
    )
    book.refresh_status()

    notify(
        student,
        Notification.Type.REQUEST_APPROVED,
        f'Your request for "{book.title}" was approved. Borrowed on {borrow_date}, due back {due}.',
        "Borrow request approved",
    )
    log_activity(librarian, "approved_borrow_request", "BorrowRequest", borrow_request.id, book.title)
    return record


def issue_book(student, book, librarian, due_date=None):
    """
    Direct circulation: a librarian checks a book out to a student at the
    desk, without the student having submitted a request first. Reuses the
    same approval path (loan-period/max-loan rules, notifications, audit
    log) via an auto-created, pre-approved request.
    """
    if student.role != "student":
        raise ValidationError("Books can only be issued to student/patron accounts.")

    borrow_request = BorrowRequest.objects.create(student=student, book=book, status=BorrowRequest.Status.PENDING)
    return approve_request(borrow_request, librarian, due_date)


def reject_request(borrow_request, librarian, reason=""):
    if borrow_request.status != BorrowRequest.Status.PENDING:
        raise ValidationError("Only pending requests can be rejected.")

    borrow_request.status = BorrowRequest.Status.REJECTED
    borrow_request.processed_by = librarian
    borrow_request.processed_at = timezone.now()
    borrow_request.rejection_reason = reason
    borrow_request.save()
    borrow_request.book.refresh_status()

    notify(
        borrow_request.student,
        Notification.Type.REQUEST_REJECTED,
        f'Your request for "{borrow_request.book.title}" was rejected.' + (f" Reason: {reason}" if reason else ""),
        "Borrow request rejected",
    )
    log_activity(librarian, "rejected_borrow_request", "BorrowRequest", borrow_request.id, reason)
    return borrow_request


def cancel_request(borrow_request, student):
    if borrow_request.student_id != student.id:
        raise PermissionDenied("You can only cancel your own requests.")
    if borrow_request.status != BorrowRequest.Status.PENDING:
        raise ValidationError("Only pending requests can be cancelled.")

    borrow_request.status = BorrowRequest.Status.CANCELLED
    borrow_request.save()
    borrow_request.book.refresh_status()

    log_activity(student, "cancelled_borrow_request", "BorrowRequest", borrow_request.id)
    return borrow_request


def return_book(record, librarian):
    if record.status == BorrowRecord.Status.RETURNED:
        raise ValidationError("This book has already been returned.")

    policy = LibraryPolicy.current()
    record.return_date = timezone.now().date()
    overdue_days = max(0, (record.return_date - record.due_date).days)
    record.status = BorrowRecord.Status.RETURNED
    record.save()

    book = record.book
    book.available_copies = min(book.total_copies, book.available_copies + 1)
    book.save(update_fields=["available_copies"])

    fine = None
    if overdue_days > 0:
        amount = round(overdue_days * float(policy.fine_per_day), 2)
        fine = Fine.objects.create(record=record, amount=amount, reason=f"{overdue_days} day(s) overdue")
        notify(
            record.student,
            Notification.Type.FINE_ISSUED,
            f'A fine of {amount} was issued for the late return of "{book.title}" ({overdue_days} day(s) overdue).',
            "Overdue fine issued",
        )

    book.refresh_status()

    notify(
        record.student,
        Notification.Type.RETURNED,
        f'Your return of "{book.title}" has been confirmed.',
        "Book returned",
    )
    log_activity(librarian, "confirmed_return", "BorrowRecord", record.id, book.title)
    return record, fine


def request_renewal(record, student):
    if record.student_id != student.id:
        raise PermissionDenied("You can only renew your own borrowed books.")
    if record.status != BorrowRecord.Status.BORROWED:
        raise ValidationError("Only currently borrowed books can be renewed.")
    if record.renewal_requested:
        raise ValidationError("A renewal request is already pending for this book.")

    policy = LibraryPolicy.current()
    if record.renewal_count >= policy.max_renewals:
        raise ValidationError("Maximum number of renewals reached for this book.")

    record.renewal_requested = True
    record.renewal_status = BorrowRecord.RenewalStatus.PENDING
    record.save()

    log_activity(student, "requested_renewal", "BorrowRecord", record.id, record.book.title)
    return record


def approve_renewal(record, librarian):
    if not record.renewal_requested:
        raise ValidationError("No pending renewal request for this record.")

    policy = LibraryPolicy.current()
    record.due_date = record.due_date + timedelta(days=policy.renewal_period_days)
    record.renewal_count += 1
    record.renewal_requested = False
    record.renewal_status = BorrowRecord.RenewalStatus.APPROVED
    record.save()

    notify(
        record.student,
        Notification.Type.RENEWAL_APPROVED,
        f'Your renewal for "{record.book.title}" was approved. New due date: {record.due_date}.',
        "Renewal approved",
    )
    log_activity(librarian, "approved_renewal", "BorrowRecord", record.id, record.book.title)
    return record


def reject_renewal(record, librarian, reason=""):
    if not record.renewal_requested:
        raise ValidationError("No pending renewal request for this record.")

    record.renewal_requested = False
    record.renewal_status = BorrowRecord.RenewalStatus.REJECTED
    record.save()

    notify(
        record.student,
        Notification.Type.RENEWAL_REJECTED,
        f'Your renewal request for "{record.book.title}" was rejected.' + (f" Reason: {reason}" if reason else ""),
        "Renewal rejected",
    )
    log_activity(librarian, "rejected_renewal", "BorrowRecord", record.id, reason)
    return record


def mark_lost(record, librarian):
    record.status = BorrowRecord.Status.LOST
    record.save()

    book = record.book
    book.status = book.Status.LOST
    book.save(update_fields=["status"])

    log_activity(librarian, "marked_book_lost", "BorrowRecord", record.id, book.title)
    return record


def pay_fine(fine, user):
    """Self-service (student) or librarian/admin-recorded fine payment."""
    if fine.is_paid:
        raise ValidationError("This fine has already been paid.")

    fine.is_paid = True
    fine.paid_at = timezone.now()
    fine.save(update_fields=["is_paid", "paid_at"])

    log_activity(user, "paid_fine", "Fine", fine.id, str(fine.amount))
    return fine
