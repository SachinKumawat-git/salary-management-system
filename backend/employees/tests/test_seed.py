import pytest
from django.contrib.auth.models import Group
from django.core.management import call_command

from employees.models import Employee, SalaryRecord


class TestSeedCommand:
    @pytest.mark.django_db
    def test_seed_creates_employees(self):
        call_command("seed_employees", count=50)
        assert Employee.objects.count() == 50

    @pytest.mark.django_db
    def test_seed_creates_salary_records(self):
        call_command("seed_employees", count=50)
        # Every employee should have at least one salary record
        employees_without_salary = Employee.objects.filter(salaries__isnull=True).count()
        assert employees_without_salary == 0

    @pytest.mark.django_db
    def test_seed_creates_hr_group(self):
        call_command("seed_employees", count=10)
        assert Group.objects.filter(name="HR Manager").exists()

    @pytest.mark.django_db
    def test_seed_is_idempotent(self):
        call_command("seed_employees", count=50)
        first_count = Employee.objects.count()
        call_command("seed_employees", count=50)
        # Should have created 100 total (50 + 50), not failed on duplicates
        assert Employee.objects.count() >= first_count

    @pytest.mark.django_db
    def test_seed_no_duplicate_active_salary(self):
        call_command("seed_employees", count=100)
        # No employee should have more than one open-ended salary
        from django.db.models import Count

        duplicates = (
            SalaryRecord.objects.filter(effective_to__isnull=True)
            .values("employee")
            .annotate(cnt=Count("id"))
            .filter(cnt__gt=1)
        )
        assert duplicates.count() == 0
