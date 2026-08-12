from rest_framework import generics

from core.models import ActivityLog, LibraryPolicy
from core.permissions import IsAdminRole, IsLibrarianOrAdmin
from core.serializers import ActivityLogSerializer, LibraryPolicySerializer
from core.utils import log_activity


class ActivityLogListView(generics.ListAPIView):
    """Read-only audit trail, visible to librarians and administrators."""

    queryset = ActivityLog.objects.select_related("user").all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsLibrarianOrAdmin]
    filterset_fields = ["action", "model_name", "user"]
    search_fields = ["action", "model_name", "description", "user__username"]
    ordering_fields = ["timestamp"]


class LibraryPolicyView(generics.RetrieveUpdateAPIView):
    """
    The system-wide borrowing policy (loan durations, fine rates, renewal
    rules, per-membership-type loan caps). Anyone authenticated can read it
    (students/librarians need it to understand due dates); only
    Administrators can change it.
    """

    serializer_class = LibraryPolicySerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsAdminRole()]
        return super().get_permissions()

    def get_object(self):
        return LibraryPolicy.current()

    def perform_update(self, serializer):
        policy = serializer.save()
        log_activity(self.request.user, "updated_library_policy", "LibraryPolicy", policy.pk)
