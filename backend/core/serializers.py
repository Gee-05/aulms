from rest_framework import serializers

from core.models import ActivityLog, LibraryPolicy


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", default="System", read_only=True)

    class Meta:
        model = ActivityLog
        fields = ["id", "user", "user_name", "action", "model_name", "object_id", "description", "timestamp"]
        read_only_fields = fields


class LibraryPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryPolicy
        fields = [
            "loan_period_days",
            "faculty_loan_period_days",
            "guest_loan_period_days",
            "max_active_loans_student",
            "max_active_loans_faculty",
            "max_active_loans_guest",
            "fine_per_day",
            "max_renewals",
            "renewal_period_days",
            "due_soon_reminder_days",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]
