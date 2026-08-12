from rest_framework.permissions import SAFE_METHODS, BasePermission

from accounts.models import User


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.STUDENT)


class IsLibrarian(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.LIBRARIAN)


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)


class IsLibrarianOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (User.Role.LIBRARIAN, User.Role.ADMIN)
        )


class IsLibrarianOrAdminOrReadOnly(BasePermission):
    """Any authenticated user can read; only librarians/admins can write."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in (User.Role.LIBRARIAN, User.Role.ADMIN)
