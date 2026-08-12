from django.contrib import admin

from borrowing.models import BorrowRecord, BorrowRequest, Fine
from core.admin_mixins import AuditedAdminMixin


@admin.register(BorrowRequest)
class BorrowRequestAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ("student", "book", "status", "request_date", "processed_by", "due_date")
    list_filter = ("status",)
    search_fields = ("student__username", "book__title", "book__isbn")


@admin.register(BorrowRecord)
class BorrowRecordAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ("student", "book", "status", "borrow_date", "due_date", "return_date", "renewal_count")
    list_filter = ("status", "renewal_status")
    search_fields = ("student__username", "book__title", "book__isbn")


@admin.register(Fine)
class FineAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ("record", "amount", "is_paid", "created_at", "paid_at")
    list_filter = ("is_paid",)
    search_fields = ("record__student__username", "record__book__title")
