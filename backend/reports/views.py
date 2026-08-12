from datetime import timedelta

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth, TruncYear
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import StudentProfile
from books.models import Book
from borrowing.models import BorrowRecord, BorrowRequest, Fine
from core.exporters import export_pdf, export_xlsx
from core.models import LibraryPolicy
from core.permissions import IsLibrarianOrAdmin

ACTIVE_STUDENT_WINDOW_DAYS = 90


class BaseReportView(APIView):
    permission_classes = [IsLibrarianOrAdmin]

    def respond(self, request, filename, title, headers, rows, json_payload):
        # NOTE: intentionally not "format" - DRF's DefaultContentNegotiation
        # already treats ?format= as a renderer-selection override and raises
        # Http404 when the value doesn't match a registered renderer class.
        fmt = (request.query_params.get("export") or "").lower()
        if fmt == "pdf":
            return export_pdf(title, headers, rows, filename)
        if fmt in ("xlsx", "excel"):
            return export_xlsx(title, headers, rows, filename)
        return Response(json_payload)


class SummaryReportView(BaseReportView):
    def get(self, request):
        book_counts = {row["status"]: row["count"] for row in Book.objects.values("status").annotate(count=Count("id"))}
        request_counts = {
            row["status"]: row["count"] for row in BorrowRequest.objects.values("status").annotate(count=Count("id"))
        }
        payload = {
            "total_books": Book.objects.count(),
            "available_books": book_counts.get(Book.Status.AVAILABLE, 0),
            "borrowed_books": book_counts.get(Book.Status.BORROWED, 0),
            "reserved_books": book_counts.get(Book.Status.RESERVED, 0),
            "overdue_books": book_counts.get(Book.Status.OVERDUE, 0),
            "lost_books": book_counts.get(Book.Status.LOST, 0),
            "pending_requests": request_counts.get(BorrowRequest.Status.PENDING, 0),
            "total_students": StudentProfile.objects.count(),
            "active_borrow_records": BorrowRecord.objects.filter(
                status__in=[BorrowRecord.Status.BORROWED, BorrowRecord.Status.OVERDUE]
            ).count(),
            "outstanding_fines": float(
                Fine.objects.filter(is_paid=False).aggregate(total=Sum("amount"))["total"] or 0
            ),
        }
        headers = list(payload.keys())
        rows = [list(payload.values())]
        return self.respond(request, "summary_report", "Library Summary Report", headers, rows, payload)


class OverdueReportView(BaseReportView):
    """
    Who currently has an overdue book. Includes records already flagged
    Overdue by the update_overdue_status sweep, plus any still marked
    Borrowed whose due date has already passed (in case the sweep hasn't
    run recently) - so this is always accurate regardless of scheduling.
    """

    def get(self, request):
        today = timezone.now().date()
        fine_per_day = float(LibraryPolicy.current().fine_per_day)

        qs = (
            BorrowRecord.objects.select_related("student", "book")
            .filter(
                Q(status=BorrowRecord.Status.OVERDUE)
                | Q(status=BorrowRecord.Status.BORROWED, due_date__lt=today)
            )
            .order_by("due_date")
        )

        rows = []
        json_payload = []
        for r in qs:
            student_name = r.student.get_full_name() or r.student.username
            student_email = r.student.email
            days_overdue = (today - r.due_date).days
            estimated_fine = round(days_overdue * fine_per_day, 2)
            rows.append([student_name, student_email, r.book.title, r.due_date, days_overdue, estimated_fine])
            json_payload.append(
                {
                    "student": student_name,
                    "email": student_email,
                    "book": r.book.title,
                    "due_date": r.due_date,
                    "days_overdue": days_overdue,
                    "estimated_fine": estimated_fine,
                    "record": r.id,
                }
            )

        headers = ["Student", "Email", "Book", "Due Date", "Days Overdue", "Estimated Fine"]
        return self.respond(request, "overdue_report", "Overdue Books Report", headers, rows, json_payload)


class BorrowHistoryReportView(BaseReportView):
    def get(self, request):
        qs = BorrowRecord.objects.select_related("student", "book").all()

        student_id = request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        if start_date:
            qs = qs.filter(borrow_date__gte=start_date)
        if end_date:
            qs = qs.filter(borrow_date__lte=end_date)

        rows = [
            [
                r.student.get_full_name() or r.student.username,
                r.book.title,
                r.borrow_date,
                r.due_date,
                r.return_date or "-",
                r.status,
            ]
            for r in qs
        ]
        headers = ["Student", "Book", "Borrow Date", "Due Date", "Return Date", "Status"]
        json_payload = [
            {
                "student": row[0],
                "book": row[1],
                "borrow_date": row[2],
                "due_date": row[3],
                "return_date": row[4],
                "status": row[5],
            }
            for row in rows
        ]
        return self.respond(request, "borrow_history_report", "Borrow History Report", headers, rows, json_payload)


class MostBorrowedReportView(BaseReportView):
    def get(self, request):
        limit = int(request.query_params.get("limit", 10))
        qs = Book.objects.annotate(borrow_count=Count("borrow_records")).order_by("-borrow_count")[:limit]

        rows = [[b.title, b.author, b.isbn, b.borrow_count] for b in qs]
        headers = ["Title", "Author", "ISBN", "Times Borrowed"]
        json_payload = [{"title": r[0], "author": r[1], "isbn": r[2], "times_borrowed": r[3]} for r in rows]
        return self.respond(request, "most_borrowed_report", "Most Borrowed Books Report", headers, rows, json_payload)


class StudentActivityReportView(BaseReportView):
    def get(self, request):
        cutoff = timezone.now().date() - timedelta(days=ACTIVE_STUDENT_WINDOW_DAYS)
        only = request.query_params.get("only")  # "active" | "inactive"

        profiles = StudentProfile.objects.select_related("user").annotate(
            total_borrows=Count("user__borrow_records"),
            recent_borrows=Count(
                "user__borrow_records", filter=Q(user__borrow_records__borrow_date__gte=cutoff)
            ),
        )

        rows = []
        json_payload = []
        for p in profiles:
            is_active = p.recent_borrows > 0
            if only == "active" and not is_active:
                continue
            if only == "inactive" and is_active:
                continue
            name = p.user.get_full_name() or p.user.username
            rows.append([name, p.student_id, p.total_borrows, "Active" if is_active else "Inactive"])
            json_payload.append(
                {
                    "student": name,
                    "student_id": p.student_id,
                    "total_borrows": p.total_borrows,
                    "activity": "active" if is_active else "inactive",
                }
            )

        headers = ["Student", "Student ID", "Total Borrows", "Activity"]
        return self.respond(request, "student_activity_report", "Student Activity Report", headers, rows, json_payload)


class FineReportView(BaseReportView):
    def get(self, request):
        qs = Fine.objects.select_related("record__student", "record__book").all()

        is_paid = request.query_params.get("is_paid")
        if is_paid is not None:
            qs = qs.filter(is_paid=is_paid.lower() == "true")

        rows = [
            [
                f.record.student.get_full_name() or f.record.student.username,
                f.record.book.title,
                float(f.amount),
                f.reason,
                "Paid" if f.is_paid else "Unpaid",
                f.created_at.date(),
            ]
            for f in qs
        ]
        headers = ["Student", "Book", "Amount", "Reason", "Status", "Issued"]
        json_payload = [
            {
                "student": r[0],
                "book": r[1],
                "amount": r[2],
                "reason": r[3],
                "status": r[4],
                "issued": r[5],
            }
            for r in rows
        ]
        return self.respond(request, "fine_report", "Fine Report", headers, rows, json_payload)


class MonthlyStatsView(BaseReportView):
    def get(self, request):
        year = int(request.query_params.get("year", timezone.now().year))
        qs = (
            BorrowRecord.objects.filter(borrow_date__year=year)
            .annotate(month=TruncMonth("borrow_date"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        rows = [[r["month"].strftime("%B %Y"), r["count"]] for r in qs]
        headers = ["Month", "Borrows"]
        json_payload = [{"month": row[0], "count": row[1]} for row in rows]
        return self.respond(request, "monthly_stats", f"Monthly Borrowing Statistics ({year})", headers, rows, json_payload)


class YearlyStatsView(BaseReportView):
    def get(self, request):
        qs = (
            BorrowRecord.objects.annotate(year=TruncYear("borrow_date"))
            .values("year")
            .annotate(count=Count("id"))
            .order_by("year")
        )
        rows = [[r["year"].year, r["count"]] for r in qs]
        headers = ["Year", "Borrows"]
        json_payload = [{"year": row[0], "count": row[1]} for row in rows]
        return self.respond(request, "yearly_stats", "Yearly Borrowing Statistics", headers, rows, json_payload)
