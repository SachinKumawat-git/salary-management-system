import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from employees.models import Department, Employee, SalaryRecord

fake = Faker()
Faker.seed(42)

DEPARTMENTS = [
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Finance",
    "Human Resources",
    "Legal",
    "Operations",
    "Customer Support",
    "Data Science",
    "Security",
]

COUNTRIES = [
    "United States",
    "United Kingdom",
    "Germany",
    "France",
    "India",
    "Canada",
    "Australia",
    "Brazil",
    "Netherlands",
    "Singapore",
]

COUNTRY_CURRENCIES = {
    "United States": "USD",
    "United Kingdom": "GBP",
    "Germany": "EUR",
    "France": "EUR",
    "India": "INR",
    "Canada": "CAD",
    "Australia": "AUD",
    "Brazil": "BRL",
    "Netherlands": "EUR",
    "Singapore": "SGD",
}

JOB_TITLES = [
    "Software Engineer",
    "Senior Software Engineer",
    "Product Manager",
    "UX Designer",
    "Data Analyst",
    "Data Scientist",
    "Marketing Specialist",
    "Sales Representative",
    "Financial Analyst",
    "HR Specialist",
    "Operations Manager",
    "Legal Counsel",
    "Customer Success Manager",
    "Security Engineer",
    "DevOps Engineer",
    "Engineering Manager",
    "Director of Product",
    "VP of Sales",
]

# Approximate base salary ranges by country in local currency
SALARY_RANGES = {
    "USD": (50_000, 200_000),
    "GBP": (40_000, 150_000),
    "EUR": (45_000, 160_000),
    "INR": (600_000, 3_000_000),
    "CAD": (55_000, 180_000),
    "AUD": (60_000, 200_000),
    "BRL": (60_000, 250_000),
    "SGD": (55_000, 200_000),
}


def random_salary(currency):
    low, high = SALARY_RANGES.get(currency, (40_000, 150_000))
    # Round to nearest 100 for realism
    return Decimal(round(random.uniform(low, high) / 100) * 100)


def random_bonus(base):
    pct = random.choice([0, 0, 0.05, 0.10, 0.15, 0.20])
    return (base * Decimal(str(pct))).quantize(Decimal("0.01"))


class Command(BaseCommand):
    help = "Seed the database with synthetic employee data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=10000,
            help="Number of employees to create (default: 10000)",
        )

    def handle(self, *args, **options):
        count = options["count"]
        self.stdout.write(f"Seeding {count} employees...")

        self.ensure_hr_group()
        departments = self.ensure_departments()
        self.seed_employees(count, departments)

        self.stdout.write(self.style.SUCCESS(f"Done. {count} employees seeded."))

    def ensure_hr_group(self):
        hr_group, _ = Group.objects.get_or_create(name="HR Manager")
        hr_user, created = User.objects.get_or_create(
            username="hrmanager",
            defaults={
                "email": "hrmanager@company.com",
                "first_name": "HR",
                "last_name": "Admin",
                "is_staff": True,
            },
        )
        if created:
            hr_user.set_password("hrpassword123")
            hr_user.save()
            self.stdout.write(self.style.SUCCESS("Created demo HR user: 'hrmanager' (password: 'hrpassword123')"))
        hr_user.groups.add(hr_group)

    def ensure_departments(self):
        deps = []
        for name in DEPARTMENTS:
            dept, _ = Department.objects.get_or_create(name=name)
            deps.append(dept)
        return deps

    def seed_employees(self, count, departments):
        today = date.today()

        # Collect existing codes and emails to avoid duplicates on rerun
        existing_codes = set(Employee.objects.values_list("employee_code", flat=True))
        existing_emails = set(Employee.objects.values_list("email", flat=True))

        employees_to_create = []
        seen_codes = set(existing_codes)
        seen_emails = set(existing_emails)

        for i in range(count):
            # Generate unique employee code
            while True:
                code = f"EMP{fake.unique.random_int(min=10000, max=99999)}"
                if code not in seen_codes:
                    seen_codes.add(code)
                    break

            # Generate unique email
            while True:
                email = fake.email()
                if email not in seen_emails:
                    seen_emails.add(email)
                    break

            country = random.choice(COUNTRIES)
            status_choices = ["active"] * 7 + ["inactive"] * 2 + ["terminated"] * 1
            employees_to_create.append(
                Employee(
                    employee_code=code,
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    email=email,
                    department=random.choice(departments),
                    job_title=random.choice(JOB_TITLES),
                    country=country,
                    employment_status=random.choice(status_choices),
                    date_joined=fake.date_between(start_date="-8y", end_date=today),
                )
            )

        with transaction.atomic():
            Employee.objects.bulk_create(employees_to_create, ignore_conflicts=True)

        # Fetch the newly created employees (those without any salary records)
        new_employees = Employee.objects.filter(salaries__isnull=True)
        self.stdout.write(f"Creating salary records for {new_employees.count()} employees...")

        salary_records = []
        for emp in new_employees:
            country = emp.country
            currency = COUNTRY_CURRENCIES.get(country, "USD")

            # Determine if we generate salary history (1-3 past records)
            num_past = random.randint(0, 2)

            # Build history from earliest to current
            start_date = emp.date_joined
            for j in range(num_past):
                period_end = start_date + timedelta(days=random.randint(180, 730))
                if period_end >= today:
                    break
                base = random_salary(currency)
                salary_records.append(
                    SalaryRecord(
                        employee=emp,
                        base_salary=base,
                        bonus=random_bonus(base),
                        currency=currency,
                        effective_from=start_date,
                        effective_to=period_end,
                    )
                )
                start_date = period_end + timedelta(days=1)

            # Current (open-ended) salary
            base = random_salary(currency)
            salary_records.append(
                SalaryRecord(
                    employee=emp,
                    base_salary=base,
                    bonus=random_bonus(base),
                    currency=currency,
                    effective_from=start_date,
                    effective_to=None,
                )
            )

        with transaction.atomic():
            SalaryRecord.objects.bulk_create(salary_records)

        self.stdout.write(f"Created {len(salary_records)} salary records.")
