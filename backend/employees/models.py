from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Employee(models.Model):
    class EmploymentStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        TERMINATED = "terminated", "Terminated"

    employee_code = models.CharField(max_length=20, unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, db_index=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="employees")
    job_title = models.CharField(max_length=150)
    country = models.CharField(max_length=100, db_index=True)
    employment_status = models.CharField(
        max_length=20,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.ACTIVE,
        db_index=True,
    )
    date_joined = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.employee_code} — {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class SalaryRecord(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="salaries")
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    bonus = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))]
    )
    currency = models.CharField(max_length=3)  # ISO 4217, e.g. USD
    effective_from = models.DateField(db_index=True)
    # NULL means this is the current active salary record
    effective_to = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-effective_from"]
        constraints = [
            # Only one active (effective_to IS NULL) salary per employee
            models.UniqueConstraint(
                fields=["employee"],
                condition=Q(effective_to__isnull=True),
                name="unique_active_salary_per_employee",
            )
        ]
        indexes = [
            models.Index(fields=["employee", "effective_from"]),
        ]

    def __str__(self):
        status = "current" if self.effective_to is None else f"until {self.effective_to}"
        return f"{self.employee.employee_code} — {self.currency} {self.base_salary} ({status})"
