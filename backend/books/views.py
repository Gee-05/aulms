from django_filters.rest_framework import FilterSet, filters
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from books.models import Book, BookReservation, Category
from books.serializers import BookReservationSerializer, BookSerializer, CategorySerializer, EbookUploadSerializer
from core.permissions import IsLibrarianOrAdmin, IsLibrarianOrAdminOrReadOnly
from core.utils import log_activity


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsLibrarianOrAdminOrReadOnly]
    search_fields = ["name"]

    def perform_create(self, serializer):
        category = serializer.save()
        log_activity(self.request.user, "created_category", "Category", category.id)

    def perform_update(self, serializer):
        category = serializer.save()
        log_activity(self.request.user, "updated_category", "Category", category.id)

    def perform_destroy(self, instance):
        log_activity(self.request.user, "deleted_category", "Category", instance.id, instance.name)
        instance.delete()


class BookFilter(FilterSet):
    category = filters.NumberFilter(field_name="category__id")
    status = filters.CharFilter(field_name="status")
    author = filters.CharFilter(field_name="author", lookup_expr="icontains")

    class Meta:
        model = Book
        fields = ["category", "status", "author"]


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.select_related("category").all()
    serializer_class = BookSerializer
    permission_classes = [IsLibrarianOrAdminOrReadOnly]
    filterset_class = BookFilter
    search_fields = ["title", "author", "isbn", "category__name"]
    ordering_fields = ["title", "author", "publication_year", "created_at", "available_copies"]

    def perform_create(self, serializer):
        book = serializer.save()
        log_activity(self.request.user, "created_book", "Book", book.id, book.title)

    def perform_update(self, serializer):
        book = serializer.save()
        log_activity(self.request.user, "updated_book", "Book", book.id, book.title)

    def perform_destroy(self, instance):
        log_activity(self.request.user, "deleted_book", "Book", instance.id, instance.title)
        instance.delete()

    @action(detail=True, methods=["post"], permission_classes=[IsLibrarianOrAdmin])
    def upload_ebook(self, request, pk=None):
        """Librarian/admin attaches (or replaces) the PDF for this book."""
        book = self.get_object()
        serializer = EbookUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        book.ebook_file = serializer.validated_data["ebook_file"]
        book.save(update_fields=["ebook_file"])
        log_activity(request.user, "uploaded_ebook", "Book", book.id, book.title)
        return Response(self.get_serializer(book).data)

    @action(detail=True, methods=["get"])
    def read(self, request, pk=None):
        """
        Digital "read online" access - unlimited/concurrent, independent of
        physical circulation (doesn't touch available_copies or require a
        borrow). Logged for audit purposes; the actual PDF is served as a
        normal media file at the returned URL.
        """
        book = self.get_object()
        if not book.ebook_file:
            raise NotFound("No digital copy is available for this book.")

        log_activity(request.user, "read_ebook", "Book", book.id, book.title)
        return Response({"url": request.build_absolute_uri(book.ebook_file.url), "title": book.title})


class BookReservationViewSet(viewsets.ModelViewSet):
    serializer_class = BookReservationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "book"]

    def get_queryset(self):
        user = self.request.user
        qs = BookReservation.objects.select_related("book", "student")
        if user.role in ("librarian", "admin"):
            return qs.all()
        return qs.filter(student=user)

    def perform_create(self, serializer):
        book = serializer.validated_data["book"]
        if book.available_copies > 0:
            raise ValidationError("This book currently has available copies; borrow it directly instead of reserving.")
        reservation = serializer.save(student=self.request.user)
        book.refresh_status()
        log_activity(self.request.user, "reserved_book", "BookReservation", reservation.id, book.title)

    def perform_destroy(self, instance):
        book = instance.book
        log_activity(self.request.user, "cancelled_reservation", "BookReservation", instance.id, book.title)
        instance.delete()
        book.refresh_status()
