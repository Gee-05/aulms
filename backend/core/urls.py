from django.urls import path

from core.views import ActivityLogListView, LibraryPolicyView

urlpatterns = [
    path("activity-logs/", ActivityLogListView.as_view(), name="activity-log-list"),
    path("policy/", LibraryPolicyView.as_view(), name="library-policy"),
]
