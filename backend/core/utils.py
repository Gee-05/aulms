from core.models import ActivityLog


def log_activity(user, action, model_name="", object_id="", description=""):
    """Records an entry in the audit trail. `user` may be None for system actions."""
    return ActivityLog.objects.create(
        user=user if (user and user.is_authenticated) else None,
        action=action,
        model_name=model_name,
        object_id=str(object_id) if object_id is not None else "",
        description=description,
    )
