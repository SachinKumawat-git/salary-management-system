import os

from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

REFRESH_COOKIE = "refresh_token"


def get_refresh_cookie_options():
    cookie_secure = not settings.DEBUG
    if "COOKIE_SECURE" in os.environ:
        cookie_secure = os.environ.get("COOKIE_SECURE", "False") == "True"
    cookie_samesite = os.environ.get("COOKIE_SAMESITE", "None" if cookie_secure else "Lax")
    return {
        "httponly": True,
        "secure": cookie_secure,
        "samesite": cookie_samesite,
        "max_age": 7 * 24 * 60 * 60,  # 7 days in seconds
        "path": "/api/auth/",
    }


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        is_hr_manager = user.groups.filter(name="HR Manager").exists()
        is_admin = bool(user.is_staff or user.is_superuser)
        is_authorized = is_hr_manager or is_admin

        response = Response(
            {
                "access": access_token,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_hr_manager": is_authorized,
                    "is_admin": is_admin,
                    "role": "Administrator" if is_admin else ("HR Manager" if is_hr_manager else "Employee"),
                },
            }
        )
        # Store refresh token in HttpOnly cookie
        response.set_cookie(
            key=REFRESH_COOKIE,
            value=str(refresh),
            **get_refresh_cookie_options(),
        )
        return response


class CookieTokenRefreshView(TokenRefreshView):
    """Reads the refresh token from the HttpOnly cookie instead of the request body."""

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE) or request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token not found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = self.get_serializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

        response_data = dict(serializer.validated_data)
        new_refresh = response_data.pop("refresh", None)

        try:
            token_obj = RefreshToken(refresh_token)
            user_id = token_obj.payload.get("user_id")
            from django.contrib.auth import get_user_model
            user_model = get_user_model()
            user = user_model.objects.filter(id=user_id).first()
            if user:
                is_hr_manager = user.groups.filter(name="HR Manager").exists()
                is_admin = bool(user.is_staff or user.is_superuser)
                is_authorized = is_hr_manager or is_admin
                response_data["user"] = {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_hr_manager": is_authorized,
                    "is_admin": is_admin,
                    "role": "Administrator" if is_admin else ("HR Manager" if is_hr_manager else "Employee"),
                }
        except Exception:
            pass

        response = Response(response_data, status=status.HTTP_200_OK)

        # Rotate the cookie with the new refresh token if provided
        if new_refresh:
            response.set_cookie(
                key=REFRESH_COOKIE,
                value=new_refresh,
                **get_refresh_cookie_options(),
            )
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except (InvalidToken, TokenError):
                pass  # Already invalid — that's fine

        response = Response({"detail": "Logged out."}, status=status.HTTP_200_OK)
        cookie_opts = get_refresh_cookie_options()
        response.delete_cookie(
            REFRESH_COOKIE,
            path=cookie_opts.get("path", "/api/auth/"),
            samesite=cookie_opts.get("samesite"),
        )
        return response
