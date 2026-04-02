from django.urls import path,include
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .views import AdminUserDetailView, AdminUserListCreateView, ChangePasswordView, RegisterView, MeView
from .views import CustomTokenObtainPairView,NonAdminUserListView, NonAdminUserUpdateView,ForgotPasswordView, ResetPasswordConfirmView


def test_accounts(request):
    return JsonResponse({"accounts": "ok"})

urlpatterns = [
    path("test/", test_accounts),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='current_user'),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("admin-users/", AdminUserListCreateView.as_view(), name="admin-users"),
    path("admin-users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("non-admin-users/", NonAdminUserListView.as_view(), name="non-admin-users"),
    path("non-admin-users/<int:pk>/", NonAdminUserUpdateView.as_view(), name="non-admin-user-update"),
    
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("reset-password-confirm/", ResetPasswordConfirmView.as_view(), name="reset_password_confirm"),

]