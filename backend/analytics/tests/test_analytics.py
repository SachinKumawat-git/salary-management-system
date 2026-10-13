from datetime import date
from decimal import Decimal

import pytest

from employees.models import Department, Employee, SalaryRecord


@pytest.fixture
def setup_analytics_data(db):
    eng = Department.objects.create(name="Engineering")
    fin = Department.objects.create(name="Finance")

    emp1 = Employee.objects.create(
        employee_code="A001",
        first_name="John",
        last_name="Doe",
        email="john@test.com",
        department=eng,
        job_title="Engineer",
        country="United States",
        employment_status="active",
        date_joined=date(2020, 1, 1),
    )
    emp2 = Employee.objects.create(
        employee_code="A002",
        first_name="Jane",
        last_name="Doe",
        email="jane@test.com",
        department=eng,
        job_title="Engineer",
        country="United States",
        employment_status="active",
        date_joined=date(2021, 1, 1),
    )
    emp3 = Employee.objects.create(
        employee_code="A003",
        first_name="Hans",
        last_name="Mueller",
        email="hans@test.com",
        department=fin,
        job_title="Analyst",
        country="Germany",
        employment_status="active",
        date_joined=date(2019, 1, 1),
    )

    SalaryRecord.objects.create(
        employee=emp1,
        base_salary=Decimal("100000"),
        bonus=Decimal("5000"),
        currency="USD",
        effective_from=date(2022, 1, 1),
    )
    SalaryRecord.objects.create(
        employee=emp2,
        base_salary=Decimal("120000"),
        bonus=Decimal("10000"),
        currency="USD",
        effective_from=date(2022, 6, 1),
    )
    SalaryRecord.objects.create(
        employee=emp3,
        base_salary=Decimal("90000"),
        bonus=Decimal("8000"),
        currency="EUR",
        effective_from=date(2021, 1, 1),
    )
    return {"eng": eng, "fin": fin}


class TestDashboard:
    def test_dashboard_summary(self, auth_client, setup_analytics_data):
        response = auth_client.get("/api/dashboard/summary/")
        assert response.status_code == 200
        data = response.data
        assert "total_employees" in data
        assert "active_employees" in data
        assert "salary_averages" in data
        assert "department_breakdown" in data
        assert "country_breakdown" in data

    def test_total_employees_count(self, auth_client, setup_analytics_data):
        response = auth_client.get("/api/dashboard/summary/")
        assert response.data["total_employees"] == 3

    def test_salary_averages_separated_by_currency(self, auth_client, setup_analytics_data):
        response = auth_client.get("/api/dashboard/summary/")
        currencies = {s["currency"] for s in response.data["salary_averages"]}
        # USD and EUR should both appear (not mixed)
        assert "USD" in currencies
        assert "EUR" in currencies

    def test_department_breakdown(self, auth_client, setup_analytics_data):
        response = auth_client.get("/api/dashboard/summary/")
        dept_names = {d["department__name"] for d in response.data["department_breakdown"]}
        assert "Engineering" in dept_names
        assert "Finance" in dept_names


class TestSalaryAnalytics:
    def test_analytics_by_department(self, auth_client, setup_analytics_data):
        response = auth_client.get("/api/analytics/salaries/")
        assert response.status_code == 200
        assert "by_department" in response.data
        assert "by_country" in response.data

    def test_analytics_filter_by_department(self, auth_client, setup_analytics_data):
        eng_id = setup_analytics_data["eng"].id
        response = auth_client.get(f"/api/analytics/salaries/?department={eng_id}")
        assert response.status_code == 200
        dept_names = {r["employee__department__name"] for r in response.data["by_department"]}
        assert "Finance" not in dept_names

    def test_currencies_not_mixed_in_analytics(self, auth_client, setup_analytics_data):
        response = auth_client.get("/api/analytics/salaries/")
        for row in response.data["by_department"]:
            # Each row should be for a specific currency — no cross-currency aggregation
            assert "currency" in row
