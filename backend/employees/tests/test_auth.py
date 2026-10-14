from rest_framework.test import APIClient


class TestLogin:
    def test_login_success(self, hr_user):
        client = APIClient()
        response = client.post(
            "/api/auth/login/",
            {"username": "hr_test", "password": "testpass123!"},
            format="json",
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "user" in response.data
        assert response.data["user"]["is_hr_manager"] is True

    def test_login_invalid_credentials(self, db):
        client = APIClient()
        response = client.post(
            "/api/auth/login/",
            {"username": "nobody", "password": "wrong"},
            format="json",
        )
        assert response.status_code == 401

    def test_refresh_token_in_cookie(self, hr_user):
        client = APIClient()
        response = client.post(
            "/api/auth/login/",
            {"username": "hr_test", "password": "testpass123!"},
            format="json",
        )
        assert "refresh_token" in response.cookies
        cookie = response.cookies["refresh_token"]
        assert cookie["httponly"]
        assert cookie["path"] == "/api/auth/"

    def test_refresh_endpoint(self, hr_user):
        client = APIClient()
        login_response = client.post(
            "/api/auth/login/",
            {"username": "hr_test", "password": "testpass123!"},
            format="json",
        )
        # Simulate browser sending the cookie
        client.cookies = login_response.cookies
        refresh_response = client.post("/api/auth/refresh/", format="json")
        assert refresh_response.status_code == 200
        assert "access" in refresh_response.data

    def test_logout_clears_cookie(self, auth_client, hr_user):
        # First, login to get cookies
        plain_client = APIClient()
        login_response = plain_client.post(
            "/api/auth/login/",
            {"username": "hr_test", "password": "testpass123!"},
            format="json",
        )
        plain_client.cookies = login_response.cookies
        plain_client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")
        logout_response = plain_client.post("/api/auth/logout/")
        assert logout_response.status_code == 200

    def test_protected_endpoint_requires_auth(self, anon_client):
        response = anon_client.get("/api/employees/")
        assert response.status_code == 401

    def test_non_hr_user_denied(self, regular_user):
        client = APIClient()
        response = client.post(
            "/api/auth/login/",
            {"username": "regular", "password": "testpass123!"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["user"]["is_hr_manager"] is False
        assert response.data["user"]["is_admin"] is False
        assert response.data["user"]["role"] == "Employee"

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        response = client.get("/api/employees/")
        assert response.status_code == 403

    def test_admin_user_allowed(self, db):
        from django.contrib.auth.models import User

        admin_user = User.objects.create_superuser(
            username="admin_test",
            password="adminpassword123!",
            email="admin@test.com",
        )
        client = APIClient()
        response = client.post(
            "/api/auth/login/",
            {"username": "admin_test", "password": "adminpassword123!"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["user"]["is_hr_manager"] is True
        assert response.data["user"]["is_admin"] is True
        assert response.data["user"]["role"] == "Administrator"

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        response = client.get("/api/employees/")
        assert response.status_code == 200

