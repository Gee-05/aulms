from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.models import LibrarianProfile, StudentProfile, User
from accounts.serializers import (
    AdminUserSerializer,
    CustomTokenObtainPairSerializer,
    LibrarianProfileSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    StudentProfileSerializer,
    UserSerializer,
)
from core.permissions import IsAdminRole, IsLibrarianOrAdmin
from core.utils import log_activity


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        super().create(request, *args, **kwargs)
        return Response(
            {"detail": "Registration successful. You can now log in."},
            status=status.HTTP_201_CREATED,
        )

    def perform_create(self, serializer):
        user = serializer.save()
        log_activity(user, "registered", "User", user.id, "Student self-registration")


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_205_RESET_CONTENT)


class PasswordResetRequestView(APIView):
    """Starts a password reset: emails a reset link if the address matches an account."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email__iexact=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            send_mail(
                "Reset your AULMS Library password",
                f"Hi {user.get_full_name() or user.username},\n\n"
                f"Click the link below to reset your password:\n{reset_url}\n\n"
                "If you didn't request this, you can safely ignore this email.",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
            if settings.DEBUG:
                # The console email backend quoted-printable-encodes the body,
                # which soft-wraps long lines and escapes "=" to "=3D" - so
                # copying the link straight out of the MIME dump above mangles
                # the uid/token query params. Print it again here, raw and
                # unwrapped, so local/dev testing has a link that actually works.
                print(f"\n[password reset link] {reset_url}\n", flush=True)
            log_activity(user, "requested_password_reset", "User", user.id)

        # Same response whether or not the email matched - don't leak account existence.
        return Response({"detail": "If an account with that email exists, a password reset link has been sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            uid = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise ValidationError({"uid": "This reset link is invalid."})

        if not default_token_generator.check_token(user, data["token"]):
            raise ValidationError({"token": "This reset link is invalid or has expired."})

        user.set_password(data["new_password"])
        user.save()
        log_activity(user, "reset_password", "User", user.id)
        return Response({"detail": "Your password has been reset. You can now log in."})


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    Admin-only roster of every account in the system (any role) - suspend,
    reactivate, or delete. Book/category/student-detail CRUD stays on their
    own dedicated endpoints; this is specifically the "manage any user
    account" admin capability.
    """

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ["get", "patch", "delete", "head", "options"]
    filterset_fields = ["role", "is_active"]
    search_fields = ["username", "email", "first_name", "last_name"]

    def perform_update(self, serializer):
        user = serializer.save()
        action = "activated_user" if user.is_active else "suspended_user"
        log_activity(self.request.user, action, "User", user.id, user.username)

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise ValidationError("You cannot delete your own account.")
        log_activity(self.request.user, "deleted_user", "User", instance.id, instance.username)
        instance.delete()


def _build_profile_payload(user):
    payload = UserSerializer(user).data
    if user.role == User.Role.STUDENT and hasattr(user, "student_profile"):
        payload["profile"] = StudentProfileSerializer(user.student_profile).data
    elif user.role == User.Role.LIBRARIAN and hasattr(user, "librarian_profile"):
        payload["profile"] = LibrarianProfileSerializer(user.librarian_profile).data
    else:
        payload["profile"] = None
    return payload


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_build_profile_payload(request.user))

    def patch(self, request):
        user = request.user
        data = request.data

        for field in ("first_name", "last_name", "email", "phone_number"):
            if field in data:
                setattr(user, field, data[field])
        user.save()

        if user.role == User.Role.STUDENT and hasattr(user, "student_profile"):
            profile = user.student_profile
            if "address" in data:
                profile.address = data["address"]
            if "date_of_birth" in data:
                # DateField rejects "" outright (it only accepts None or a
                # valid YYYY-MM-DD string) - an empty date input sends "".
                profile.date_of_birth = data["date_of_birth"] or None
            profile.save()
        elif user.role == User.Role.LIBRARIAN and hasattr(user, "librarian_profile"):
            profile = user.librarian_profile
            if "department" in data:
                profile.department = data["department"]
            profile.save()

        log_activity(user, "updated_profile", "User", user.id)
        return Response(_build_profile_payload(user))


class StudentProfileViewSet(viewsets.ModelViewSet):
    """Used by librarians/admins to search and manage student accounts."""

    queryset = StudentProfile.objects.select_related("user").all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsLibrarianOrAdmin]
    filterset_fields = ["is_active_member", "membership_type"]
    search_fields = ["student_id", "user__username", "user__first_name", "user__last_name", "user__email"]
    ordering_fields = ["membership_date"]

    def perform_update(self, serializer):
        profile = serializer.save()
        log_activity(self.request.user, "updated_student", "StudentProfile", profile.id)

    def perform_destroy(self, instance):
        user = instance.user
        log_activity(self.request.user, "deleted_student", "StudentProfile", instance.id)
        user.delete()


class LibrarianProfileViewSet(viewsets.ModelViewSet):
    """Full librarian-account management, restricted to administrators."""

    queryset = LibrarianProfile.objects.select_related("user").all()
    serializer_class = LibrarianProfileSerializer
    permission_classes = [IsAdminRole]
    search_fields = ["employee_id", "user__username", "user__first_name", "user__last_name", "user__email"]

    def perform_destroy(self, instance):
        user = instance.user
        log_activity(self.request.user, "deleted_librarian", "LibrarianProfile", instance.id)
        user.delete()
