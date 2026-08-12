from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from borrowing import services
from borrowing.models import BorrowRecord, BorrowRequest, Fine
from borrowing.serializers import (
    ApproveRequestSerializer,
    BorrowRecordSerializer,
    BorrowRequestSerializer,
    FineSerializer,
    IssueBookSerializer,
    RejectRequestSerializer,
)
from core.permissions import IsLibrarianOrAdmin
from core.utils import log_activity


class BorrowRequestViewSet(viewsets.ModelViewSet):
    serializer_class = BorrowRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]
    filterset_fields = ["status", "student", "book"]
    search_fields = ["book__title", "book__isbn", "student__username"]
    ordering_fields = ["request_date"]

    def get_queryset(self):
        qs = BorrowRequest.objects.select_related("student", "book", "processed_by")
        user = self.request.user
        if user.role == User.Role.STUDENT:
            return qs.filter(student=user)
        return qs.all()

    def perform_create(self, serializer):
        student = self.request.user
        if student.role != User.Role.STUDENT:
            raise ValidationError("Only students can submit borrow requests.")
        book = serializer.validated_data["book"]
        if BorrowRequest.objects.filter(student=student, book=book, status=BorrowRequest.Status.PENDING).exists():
            raise ValidationError("You already have a pending request for this book.")
        borrow_request = serializer.save(student=student)
        borrow_request.book.refresh_status()
        log_activity(student, "submitted_borrow_request", "BorrowRequest", borrow_request.id, book.title)

    @action(detail=True, methods=["post"], permission_classes=[IsLibrarianOrAdmin])
    def approve(self, request, pk=None):
        borrow_request = self.get_object()
        serializer = ApproveRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = services.approve_request(
            borrow_request, request.user, serializer.validated_data.get("due_date")
        )
        return Response(BorrowRecordSerializer(record).data)

    @action(detail=True, methods=["post"], permission_classes=[IsLibrarianOrAdmin])
    def reject(self, request, pk=None):
        borrow_request = self.get_object()
        serializer = RejectRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        borrow_request = services.reject_request(
            borrow_request, request.user, serializer.validated_data.get("reason", "")
        )
        return Response(self.get_serializer(borrow_request).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        borrow_request = self.get_object()
        borrow_request = services.cancel_request(borrow_request, request.user)
        return Response(self.get_serializer(borrow_request).data)

    @action(detail=False, methods=["post"], permission_classes=[IsLibrarianOrAdmin])
    def issue(self, request):
        """Desk circulation: librarian checks a book out to a student directly."""
        serializer = IssueBookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = services.issue_book(
            serializer.validated_data["student"],
            serializer.validated_data["book"],
            request.user,
            serializer.validated_data.get("due_date"),
        )
        return Response(BorrowRecordSerializer(record).data)


class BorrowRecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BorrowRecordSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "student", "book", "renewal_requested"]
    search_fields = ["book__title", "book__isbn", "student__username"]
    ordering_fields = ["borrow_date", "due_date", "created_at"]

    def get_queryset(self):
        qs = BorrowRecord.objects.select_related("student", "book").prefetch_related("fines")
        user = self.request.user
        if user.role == User.Role.STUDENT:
            return qs.filter(student=user)
        return qs.all()

    @action(detail=True, methods=["post"], permission_classes=[IsLibrarianOrAdmin])
    def return_book(self, request, pk=None):
        record = self.get_object()
        record, fine = services.return_book(record, request.user)
        data = self.get_serializer(record).data
        return Response(data)

    @action(detail=True, methods=["post"])
    def request_renewal(self, request, pk=None):
        record = self.get_object()
        record = services.request_renewal(record, request.user)
        return Response(self.get_serializer(record).data)

    @action(detail=True, methods=["post"], permission_classes=[IsLibrarianOrAdmin])
    def approve_renewal(self, request, pk=None):
        record = self.get_object()
        record = services.approve_renewal(record, request.user)
        return Response(self.get_serializer(record).data)

    @action(detail=True, methods=["post"], permission_classes=[IsLibrarianOrAdmin])
    def reject_renewal(self, request, pk=None):
        record = self.get_object()
        reason = request.data.get("reason", "")
        record = services.reject_renewal(record, request.user, reason)
        return Response(self.get_serializer(record).data)

    @action(detail=True, methods=["post"], permission_classes=[IsLibrarianOrAdmin])
    def mark_lost(self, request, pk=None):
        record = self.get_object()
        record = services.mark_lost(record, request.user)
        return Response(self.get_serializer(record).data)


class FineViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FineSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_paid", "record__student"]
    ordering_fields = ["created_at", "amount"]

    def get_queryset(self):
        qs = Fine.objects.select_related("record__student", "record__book")
        user = self.request.user
        if user.role == User.Role.STUDENT:
            return qs.filter(record__student=user)
        return qs.all()

    @action(detail=True, methods=["post"], permission_classes=[IsLibrarianOrAdmin])
    def mark_paid(self, request, pk=None):
        """Librarian/admin records a fine as paid (e.g. cash paid at the desk)."""
        fine = services.pay_fine(self.get_object(), request.user)
        return Response(self.get_serializer(fine).data)

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        """Student self-service payment of their own fine."""
        fine = self.get_object()
        if request.user.role == User.Role.STUDENT and fine.record.student_id != request.user.id:
            raise PermissionDenied("You can only pay your own fines.")
        fine = services.pay_fine(fine, request.user)
        return Response(self.get_serializer(fine).data)
