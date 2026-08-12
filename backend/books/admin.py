from django.contrib import admin
from import_export.admin import ImportExportModelAdmin

from books.models import Book, BookReservation, Category
from books.resources import BookResource, CategoryResource
from core.admin_mixins import AuditedAdminMixin


@admin.register(Category)
class CategoryAdmin(AuditedAdminMixin, ImportExportModelAdmin):
    resource_classes = [CategoryResource]
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Book)
class BookAdmin(AuditedAdminMixin, ImportExportModelAdmin):
    resource_classes = [BookResource]
    list_display = (
        "title",
        "author",
        "isbn",
        "category",
        "status",
        "total_copies",
        "available_copies",
        "shelf_location",
        "has_ebook",
    )
    list_filter = ("status", "category")
    search_fields = ("title", "author", "isbn")
    readonly_fields = ("qr_code",)

    @admin.display(boolean=True, description="Has ebook")
    def has_ebook(self, obj):
        return bool(obj.ebook_file)


@admin.register(BookReservation)
class BookReservationAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ("book", "student", "status", "reserved_at", "expires_at")
    list_filter = ("status",)
    search_fields = ("book__title", "student__username")
