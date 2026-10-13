from django.urls import path

from .auth_views import CookieTokenRefreshView, LoginView, LogoutView

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", CookieTokenRefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
]
