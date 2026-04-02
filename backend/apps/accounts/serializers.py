from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model, password_validation
User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        login_value = attrs.get("email") or attrs.get("username") or attrs.get(self.username_field)
        password = attrs.get("password")

        if not login_value or not password:
            raise serializers.ValidationError("Email and password are required.")

        user = User.objects.filter(email__iexact=login_value).first()

        if user and not user.is_active:
            raise AuthenticationFailed("Your account is disabled. Contact admin.")

        attrs[self.username_field] = login_value
        return super().validate(attrs)


from rest_framework import serializers
from django.contrib.auth import password_validation
from django.contrib.auth import get_user_model
from apps.accounts.models import Profile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(required=False, default=User.Role.BUYER)

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "username",
            "phone_number",
            "password",
            "confirm_password",
            "role",
        ]

    def validate_role(self, value):
        value = (value or "").strip().lower()
        allowed_roles = [User.Role.BUYER, User.Role.SELLER]
        if value not in allowed_roles:
            raise serializers.ValidationError("Invalid account type.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        password_validation.validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")

        validated_data["email"] = validated_data["email"].strip().lower()
        validated_data["role"] = validated_data.get("role", User.Role.BUYER)

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        Profile.objects.get_or_create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "role","is_staff","is_superuser", "is_email_verified", "is_phone_verified"]
        
        
        
        
        





class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "confirm_password",
            "is_active",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = ["id", "is_staff"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        if password != confirm_password:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")

        user = User(
            username=validated_data.get("username"),
            email=validated_data.get("email"),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            is_active=validated_data.get("is_active", True),
            is_staff=True,
            is_superuser=validated_data.get("is_superuser", False),
        )
        user.set_password(password)
        user.save()
        return user
    
    
    
    
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "confirm_password",
            "is_active",
            "is_superuser",
        ]
        read_only_fields = ["id"]

    def validate_username(self, value):
        qs = User.objects.filter(username__iexact=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        qs = User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        if password or confirm_password:
            if password != confirm_password:
                raise serializers.ValidationError(
                    {"confirm_password": "Passwords do not match."}
                )

        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        validated_data.pop("confirm_password", None)

        instance.username = validated_data.get("username", instance.username)
        instance.email = validated_data.get("email", instance.email)
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.is_active = validated_data.get("is_active", instance.is_active)
        instance.is_staff = True
        instance.is_superuser = validated_data.get("is_superuser", instance.is_superuser)

        if password:
            instance.set_password(password)

        instance.save()
        return instance
    
    
    



class NonAdminUserStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
            "is_staff",
            "is_superuser",
        ]

    def validate(self, attrs):
        allowed_fields = {"is_active"}
        incoming_fields = set(self.initial_data.keys())

        invalid_fields = incoming_fields - allowed_fields
        if invalid_fields:
            raise serializers.ValidationError(
                {
                    field: "You are not allowed to update this field."
                    for field in invalid_fields
                }
            )

        return attrs
    
    
    
    
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class NonAdminUserStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
            "is_staff",
            "is_superuser",
        ]

    def validate(self, attrs):
        allowed_fields = {"is_active"}
        incoming_fields = set(self.initial_data.keys())

        invalid_fields = incoming_fields - allowed_fields
        if invalid_fields:
            raise serializers.ValidationError(
                {
                    field: "You are not allowed to update this field."
                    for field in invalid_fields
                }
            )

        return attrs
    
    
    
class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = ["email", "role", "is_staff", "is_superuser"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, min_length=8, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs
    
    
    
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        password_validation.validate_password(attrs["new_password"])
        return attrs