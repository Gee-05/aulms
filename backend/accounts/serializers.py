from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import LibrarianProfile, StudentProfile, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "date_joined",
            "is_active",
        ]
        read_only_fields = ["id", "role", "date_joined", "is_active"]


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "student_id",
            "membership_type",
            "address",
            "date_of_birth",
            "membership_date",
            "is_active_member",
        ]
        read_only_fields = ["id", "student_id", "membership_date"]


class LibrarianProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = LibrarianProfile
        fields = ["id", "user", "employee_id", "department"]
        read_only_fields = ["id", "employee_id"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)
    membership_type = serializers.ChoiceField(
        choices=StudentProfile.MembershipType.choices,
        default=StudentProfile.MembershipType.STUDENT,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "phone",
            "address",
            "date_of_birth",
            "membership_type",
            "password",
            "password2",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        phone = validated_data.pop("phone", "")
        address = validated_data.pop("address", "")
        date_of_birth = validated_data.pop("date_of_birth", None)
        membership_type = validated_data.pop("membership_type", StudentProfile.MembershipType.STUDENT)
        password = validated_data.pop("password")

        user = User.objects.create(role=User.Role.STUDENT, **validated_data)
        user.set_password(password)
        user.save()

        StudentProfile.objects.create(
            user=user,
            student_id=f"STU{user.id:05d}",
            membership_type=membership_type,
            phone=phone,
            address=address,
            date_of_birth=date_of_birth,
        )
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])


class AdminUserSerializer(serializers.ModelSerializer):
    """Full-roster view for Admin's user management (any role)."""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "is_staff",
            "date_joined",
        ]
        read_only_fields = ["id", "username", "role", "is_staff", "date_joined"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
