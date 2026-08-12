from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from accounts.models import LibrarianProfile, StudentProfile, User
from core.admin_mixins import AuditedAdminMixin


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    extra = 0


class LibrarianProfileInline(admin.StackedInline):
    model = LibrarianProfile
    can_delete = False
    extra = 0


@admin.register(User)
class UserAdmin(AuditedAdminMixin, DjangoUserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Library role", {"fields": ("role", "phone_number")}),
    )

    def get_inlines(self, request, obj):
        if obj and obj.role == User.Role.STUDENT:
            return [StudentProfileInline]
        if obj and obj.role == User.Role.LIBRARIAN:
            return [LibrarianProfileInline]
        return []


@admin.register(StudentProfile)
class StudentProfileAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ("student_id", "user", "membership_type", "is_active_member", "membership_date")
    list_filter = ("membership_type", "is_active_member")
    search_fields = ("student_id", "user__username", "user__first_name", "user__last_name")


@admin.register(LibrarianProfile)
class LibrarianProfileAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ("employee_id", "user", "department")
    search_fields = ("employee_id", "user__username", "user__first_name", "user__last_name")
