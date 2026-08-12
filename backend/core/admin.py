from django.contrib import admin

from core.admin_mixins import AuditedAdminMixin
from core.models import ActivityLog, LibraryPolicy

# Native Django Admin branding - kept as a fallback alongside the Jazzmin
# JAZZMIN_SETTINGS (config/settings.py), which is the theme actually shown.
admin.site.site_header = "Advanced Settings"
admin.site.site_title = "Advanced Settings"
admin.site.index_title = "AULMS Administration"


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "action", "model_name", "object_id")
    list_filter = ("action", "model_name", "timestamp")
    search_fields = ("user__username", "action", "model_name", "description")
    readonly_fields = ("user", "action", "model_name", "object_id", "description", "timestamp")
    ordering = ("-timestamp",)

    def has_add_permission(self, request):
        return False


@admin.register(LibraryPolicy)
class LibraryPolicyAdmin(AuditedAdminMixin, admin.ModelAdmin):
    list_display = ("loan_period_days", "fine_per_day", "max_renewals", "updated_at")

    def has_add_permission(self, request):
        # Singleton - only ever one row (pk=1), created on first access.
        return not LibraryPolicy.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
