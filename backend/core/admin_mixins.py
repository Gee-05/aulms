from core.utils import log_activity


class AuditedAdminMixin:
    """
    Mirrors changes made through Django Admin into ActivityLog.

    API-driven changes are already logged explicitly by each view/service
    function with rich, specific action names (e.g. "approved_borrow_request").
    Admin-driven changes have no equivalent hook by default, so without this
    mixin anything a librarian/admin does from /admin/ is invisible in the
    audit trail. This closes that gap the idiomatic Django way (ModelAdmin
    hooks) rather than a blanket post_save signal, which would double-log
    the API-driven changes that already call log_activity() themselves.
    """

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        action = f"admin_{'updated' if change else 'created'}_{obj.__class__.__name__.lower()}"
        log_activity(request.user, action, obj.__class__.__name__, obj.pk, str(obj))

    def delete_model(self, request, obj):
        action = f"admin_deleted_{obj.__class__.__name__.lower()}"
        log_activity(request.user, action, obj.__class__.__name__, obj.pk, str(obj))
        super().delete_model(request, obj)

    def delete_queryset(self, request, queryset):
        model_name = queryset.model.__name__
        for obj in queryset:
            log_activity(request.user, f"admin_deleted_{model_name.lower()}", model_name, obj.pk, str(obj))
        super().delete_queryset(request, queryset)
