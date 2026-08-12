from rest_framework import serializers

from books.models import Book, BookReservation, Category


class CategorySerializer(serializers.ModelSerializer):
    book_count = serializers.IntegerField(source="books.count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "description", "book_count"]


MAX_EBOOK_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    has_ebook = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id",
            "isbn",
            "title",
            "author",
            "category",
            "category_name",
            "description",
            "publisher",
            "publication_year",
            "total_copies",
            "available_copies",
            "shelf_location",
            "cover_image",
            "ebook_file",
            "has_ebook",
            "qr_code",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "ebook_file", "qr_code", "status", "created_at", "updated_at"]

    def get_has_ebook(self, obj):
        return bool(obj.ebook_file)

    def validate(self, attrs):
        total = attrs.get("total_copies", getattr(self.instance, "total_copies", None))
        available = attrs.get("available_copies", getattr(self.instance, "available_copies", None))
        if total is not None and available is not None and available > total:
            raise serializers.ValidationError(
                {"available_copies": "Available copies cannot exceed total copies."}
            )
        return attrs


class EbookUploadSerializer(serializers.Serializer):
    """Separate, librarian-only endpoint for attaching/replacing a book's PDF."""

    ebook_file = serializers.FileField()

    def validate_ebook_file(self, value):
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Only PDF files are supported.")
        if value.size > MAX_EBOOK_SIZE_BYTES:
            raise serializers.ValidationError("PDF must be 25 MB or smaller.")
        return value


class BookReservationSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)

    class Meta:
        model = BookReservation
        fields = [
            "id",
            "book",
            "book_title",
            "student",
            "student_name",
            "status",
            "reserved_at",
            "expires_at",
        ]
        read_only_fields = ["id", "student", "status", "reserved_at"]
