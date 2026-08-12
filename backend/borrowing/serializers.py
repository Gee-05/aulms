from rest_framework import serializers

from accounts.models import User
from books.models import Book
from borrowing.models import BorrowRecord, BorrowRequest, Fine


class BorrowRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    book_title = serializers.CharField(source="book.title", read_only=True)
    processed_by_name = serializers.CharField(
        source="processed_by.get_full_name", read_only=True, default=None
    )

    class Meta:
        model = BorrowRequest
        fields = [
            "id",
            "student",
            "student_name",
            "book",
            "book_title",
            "status",
            "request_date",
            "processed_by",
            "processed_by_name",
            "processed_at",
            "borrow_date",
            "due_date",
            "rejection_reason",
        ]
        read_only_fields = [
            "id",
            "student",
            "status",
            "request_date",
            "processed_by",
            "processed_at",
            "borrow_date",
            "due_date",
            "rejection_reason",
        ]


class ApproveRequestSerializer(serializers.Serializer):
    due_date = serializers.DateField(required=False)


class RejectRequestSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class IssueBookSerializer(serializers.Serializer):
    """Librarian desk checkout: issue a book directly to a student."""

    student = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role=User.Role.STUDENT))
    book = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all())
    due_date = serializers.DateField(required=False)


class FineSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="record.book.title", read_only=True)
    student_name = serializers.CharField(source="record.student.get_full_name", read_only=True)

    class Meta:
        model = Fine
        fields = ["id", "record", "book_title", "student_name", "amount", "reason", "is_paid", "created_at", "paid_at"]
        read_only_fields = ["id", "record", "amount", "reason", "created_at"]


class BorrowRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_isbn = serializers.CharField(source="book.isbn", read_only=True)
    fines = FineSerializer(many=True, read_only=True)

    class Meta:
        model = BorrowRecord
        fields = [
            "id",
            "request",
            "student",
            "student_name",
            "book",
            "book_title",
            "book_isbn",
            "borrow_date",
            "due_date",
            "return_date",
            "status",
            "renewal_count",
            "renewal_requested",
            "renewal_status",
            "fines",
            "created_at",
        ]
        read_only_fields = fields
