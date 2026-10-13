from datetime import date
from decimal import Decimal

import pytest

from employees.models import Department, Employee, SalaryRecord


@pytest.fixture
def department(db):
    return Department.objects.create(name="Finance")


@pytest.fixture
def employee(db, department):
    return Employee.objects.create(
        employee_code="EMP010",
        first_name="Carol",
        last_name="White",
        email="carol@example.com",
        department=department,
        job_title="Analyst",
        country="United States",
        employment_status="active",
        date_joined=date(2020, 1, 1),
    )


@pytest.fixture
def current_salary(db, employee):
    return SalaryRecord.objects.create(
        employee=employee,
        base_salary=Decimal("80000.00"),
        bonus=Decimal("5000.00"),
        currency="USD",
        effective_from=date(2023, 1, 1),
        effective_to=None,
    )


class TestSalaryCreation:
    def test_add_first_salary(self, auth_client, employee):
        response = auth_client.post(
            f"/api/employees/{employee.id}/salaries/",
            {
                "base_salary": "75000.00",
                "bonus": "3000.00",
                "currency": "USD",
                "effective_from": "2023-06-01",
            },
            format="json",
        )
        assert response.status_code == 201
        assert response.data["base_salary"] == "75000.00"
        assert response.data["effective_to"] is None

    def test_salary_revision_closes_previous(self, auth_client, employee, current_salary):
        response = auth_client.post(
            f"/api/employees/{employee.id}/salaries/",
            {
                "base_salary": "90000.00",
                "bonus": "8000.00",
                "currency": "USD",
                "effective_from": "2024-01-01",
            },
            format="json",
        )
        assert response.status_code == 201

        current_salary.refresh_from_db()
        assert current_salary.effective_to == date(2023, 12, 31)

        assert SalaryRecord.objects.filter(employee=employee, effective_to__isnull=True).count() == 1

    def test_salary_history_preserved(self, auth_client, employee, current_salary):
        auth_client.post(
            f"/api/employees/{employee.id}/salaries/",
            {
                "base_salary": "90000.00",
                "bonus": "8000.00",
                "currency": "USD",
                "effective_from": "2024-01-01",
            },
            format="json",
        )
        assert SalaryRecord.objects.filter(employee=employee).count() == 2

    def test_negative_salary_rejected(self, auth_client, employee):
        response = auth_client.post(
            f"/api/employees/{employee.id}/salaries/",
            {
                "base_salary": "-1000.00",
                "currency": "USD",
                "effective_from": "2024-01-01",
            },
            format="json",
        )
        assert response.status_code == 400

    def test_effective_to_before_from_rejected(self, auth_client, employee):
        response = auth_client.post(
            f"/api/employees/{employee.id}/salaries/",
            {
                "base_salary": "50000.00",
                "currency": "USD",
                "effective_from": "2024-06-01",
                "effective_to": "2024-01-01",
            },
            format="json",
        )
        assert response.status_code == 400

    def test_overlapping_period_rejected(self, auth_client, employee, current_salary):
        # current_salary is from 2023-01-01 with no end date
        # Adding another open-ended salary with an earlier date should fail
        response = auth_client.post(
            f"/api/employees/{employee.id}/salaries/",
            {
                "base_salary": "85000.00",
                "currency": "USD",
                "effective_from": "2022-01-01",
                "effective_to": "2023-06-01",  # overlaps with current_salary from 2023-01-01
            },
            format="json",
        )
        assert response.status_code == 400


class TestSalaryHistory:
    def test_list_salary_history(self, auth_client, employee, current_salary):
        response = auth_client.get(f"/api/employees/{employee.id}/salaries/")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == current_salary.id

    def test_salary_history_for_nonexistent_employee(self, auth_client):
        response = auth_client.get("/api/employees/99999/salaries/")
        assert response.status_code == 404

    def test_salary_access_requires_hr(self, regular_user, employee, current_salary):
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken

        client = APIClient()
        refresh = RefreshToken.for_user(regular_user)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
        response = client.get(f"/api/employees/{employee.id}/salaries/")
        assert response.status_code == 403
