from rest_framework import generics, permissions,status

from .permissions import IsActiveUser
from .serializers import AdminUserUpdateSerializer, ChangePasswordSerializer, ForgotPasswordSerializer, MeSerializer, RegisterSerializer, ResetPasswordConfirmSerializer, UserSerializer

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import serializers
from .serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import NonAdminUserStatusSerializer
from rest_framework.views import APIView, settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

User = get_user_model()
token_generator = PasswordResetTokenGenerator()







class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    # serializer_class = UserSerializer
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated,IsActiveUser]

    def get_object(self):
        return self.request.user
    

    

  
    
    
User = get_user_model()

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
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        validated_data["is_staff"] = True
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AdminUserListCreateView(generics.ListCreateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser,IsActiveUser]

    def get_queryset(self):
        return User.objects.filter(is_staff=True).order_by("-id")
    
    
    
class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAdminUser,IsActiveUser]
    queryset = User.objects.filter(is_staff=True)
    serializer_class = AdminUserUpdateSerializer
    
    def perform_update(self, serializer):
        target_user = self.get_object()
        request_user = self.request.user

        new_is_active = serializer.validated_data.get("is_active", target_user.is_active)
        new_is_superuser = serializer.validated_data.get("is_superuser", target_user.is_superuser)

        if request_user.pk == target_user.pk and new_is_active is False:
            raise ValidationError({"detail": "You cannot disable your own account."})

        if request_user.pk == target_user.pk and new_is_superuser is False and request_user.is_superuser:
            raise ValidationError({"detail": "You cannot remove your own superuser access."})

        serializer.save()
        
        
        
class NonAdminUserListView(generics.ListAPIView):
    serializer_class = NonAdminUserStatusSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return User.objects.filter(
            is_staff=False,
            is_superuser=False
        ).order_by("-date_joined")


class NonAdminUserUpdateView(generics.UpdateAPIView):
    serializer_class = NonAdminUserStatusSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.filter(is_staff=False, is_superuser=False)

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()

        user.is_active = request.data.get("is_active", user.is_active)
        user.save(update_fields=["is_active"])

        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    
    
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]

        if not user.check_password(old_password):
            return Response(
                {"old_password": ["Old password is incorrect."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )
        
        
class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        # Optional: only verified emails
        user = User.objects.filter(email=email, is_active=True).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = token_generator.make_token(user)

            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
            reset_link = f"{frontend_url}/reset-password/{uid}/{token}"

            send_mail(
                subject="Reset your password",
                message=(
                    f"Hello {getattr(user, 'username', '')},\n\n"
                    f"Use the link below to reset your password:\n\n{reset_link}\n\n"
                    f"If you did not request this, you can ignore this email."
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[email],
                fail_silently=False,
            )

        return Response(
            {
                "message": "If an account with that email exists, a reset link has been sent."
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not token_generator.check_token(user, token):
            return Response(
                {"error": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        send_mail(
            subject="Your password was changed",
            message=(
                f"Hello {getattr(user, 'username', '')},\n\n"
                "Your password has been changed successfully.\n"
                "If this was not you, contact support immediately."
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[user.email],
            fail_silently=True,
        )

        return Response(
            {"message": "Password has been reset successfully."},
            status=status.HTTP_200_OK,
        )