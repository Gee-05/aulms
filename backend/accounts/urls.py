from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from django.urls import include, path

from accounts.views import (
    CustomTokenObtainPairView,
    LibrarianProfileViewSet,
    LogoutView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    StudentProfileViewSet,
    UserManagementViewSet,
)

router = DefaultRouter()
router.register("students", StudentProfileViewSet, basename="student-profile")
router.register("librarians", LibrarianProfileViewSet, basename="librarian-profile")
router.register("users", UserManagementViewSet, basename="user-management")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("", include(router.urls)),
]
