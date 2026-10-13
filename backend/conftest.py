import pytest
from django.contrib.auth.models import Group, User
from rest_framework.test import APIClient


@pytest.fixture
def hr_group(db):
    group, _ = Group.objects.get_or_create(name="HR Manager")
    return group


@pytest.fixture
def hr_user(db, hr_group):
    user = User.objects.create_user(username="hr_test", password="testpass123!")
    user.groups.add(hr_group)
    return user


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(username="regular", password="testpass123!")


@pytest.fixture
def auth_client(hr_user):
    client = APIClient()
    response = client.post(
        "/api/auth/login/",
        {"username": "hr_test", "password": "testpass123!"},
        format="json",
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return client


@pytest.fixture
def anon_client():
    return APIClient()
