from datetime import date

import pytest

from employees.models import Department, Employee


@pytest.fixture
def department(db):
    return Department.objects.create(name="Engineering")


@pytest.fixture
def employee(db, department):
    return Employee.objects.create(
        employee_code="EMP001",
        first_name="Alice",
        last_name="Smith",
        email="alice@example.com",
        department=department,
        job_title="Software Engineer",
        country="United States",
        employment_status="active",
        date_joined=date(2021, 1, 15),
    )


class TestEmployeeCreation:
    def test_create_employee(self, auth_client, department):
        response = auth_client.post(
            "/api/employees/",
            {
                "employee_code": "EMP100",
                "first_name": "Bob",
                "last_name": "Jones",
                "email": "bob@example.com",
                "department": department.id,
                "job_title": "Developer",
                "country": "Canada",
                "employment_status": "active",
                "date_joined": "2022-03-01",
            },
            format="json",
        )
        assert response.status_code == 201
        assert response.data["employee_code"] == "EMP100"

    def test_duplicate_employee_code_rejected(self, auth_client, employee, department):
        response = auth_client.post(
            "/api/employees/",
            {
                "employee_code": "EMP001",  # Already exists
                "first_name": "New",
                "last_name": "Person",
                "email": "newperson@example.com",
                "department": department.id,
                "job_title": "Analyst",
                "country": "United States",
                "employment_status": "active",
                "date_joined": "2023-01-01",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "employee_code" in response.data

    def test_duplicate_email_rejected(self, auth_client, employee, department):
        response = auth_client.post(
            "/api/employees/",
            {
                "employee_code": "EMP999",
                "first_name": "Duplicate",
                "last_name": "Email",
                "email": "alice@example.com",  # Already exists
                "department": department.id,
                "job_title": "Analyst",
                "country": "United States",
                "employment_status": "active",
                "date_joined": "2023-01-01",
            },
            format="json",
        )
        assert response.status_code == 400

    def test_missing_required_fields(self, auth_client, department):
        response = auth_client.post("/api/employees/", {}, format="json")
        assert response.status_code == 400


class TestEmployeeList:
    def test_list_employees(self, auth_client, employee):
        response = auth_client.get("/api/employees/")
        assert response.status_code == 200
        assert "results" in response.data
        assert response.data["count"] >= 1

    def test_search_by_name(self, auth_client, employee):
        response = auth_client.get("/api/employees/?search=Alice")
        assert response.status_code == 200
        assert any(e["first_name"] == "Alice" for e in response.data["results"])

    def test_search_by_employee_code(self, auth_client, employee):
        response = auth_client.get("/api/employees/?search=EMP001")
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_filter_by_employment_status(self, auth_client, employee):
        response = auth_client.get("/api/employees/?employment_status=active")
        assert response.status_code == 200
        for emp in response.data["results"]:
            assert emp["employment_status"] == "active"

    def test_filter_by_department(self, auth_client, employee, department):
        response = auth_client.get(f"/api/employees/?department={department.id}")
        assert response.status_code == 200
        assert response.data["count"] >= 1

    def test_pagination_defaults(self, auth_client, employee):
        response = auth_client.get("/api/employees/")
        assert response.status_code == 200
        assert "next" in response.data
        assert "previous" in response.data
        assert "count" in response.data

    def test_pagination_max_page_size(self, auth_client):
        # page_size above max should be capped
        response = auth_client.get("/api/employees/?page_size=9999")
        assert response.status_code == 200

    def test_ordering_by_last_name(self, auth_client, employee, department):
        Employee.objects.create(
            employee_code="EMP002",
            first_name="Zara",
            last_name="Adams",
            email="zara@example.com",
            department=department,
            job_title="Designer",
            country="UK",
            employment_status="active",
            date_joined=date(2022, 5, 1),
        )
        response = auth_client.get("/api/employees/?ordering=last_name")
        assert response.status_code == 200
        names = [e["last_name"] for e in response.data["results"]]
        assert names == sorted(names)


class TestEmployeeDetail:
    def test_retrieve_employee(self, auth_client, employee):
        response = auth_client.get(f"/api/employees/{employee.id}/")
        assert response.status_code == 200
        assert response.data["employee_code"] == "EMP001"

    def test_partial_update(self, auth_client, employee):
        response = auth_client.patch(
            f"/api/employees/{employee.id}/",
            {"job_title": "Senior Software Engineer"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["job_title"] == "Senior Software Engineer"

    def test_404_for_nonexistent(self, auth_client):
        response = auth_client.get("/api/employees/99999/")
        assert response.status_code == 404
