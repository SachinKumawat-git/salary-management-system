from django.contrib import admin

from .models import Department, Employee, SalaryRecord


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at"]
    search_fields = ["name"]


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ["employee_code", "first_name", "last_name", "email", "department", "employment_status"]
    list_filter = ["department", "employment_status", "country"]
    search_fields = ["employee_code", "first_name", "last_name", "email"]
    raw_id_fields = ["department"]


@admin.register(SalaryRecord)
class SalaryRecordAdmin(admin.ModelAdmin):
    list_display = ["employee", "base_salary", "bonus", "currency", "effective_from", "effective_to"]
    list_filter = ["currency"]
    raw_id_fields = ["employee"]
