import django_filters

from .models import Employee


class EmployeeFilter(django_filters.FilterSet):
    department = django_filters.NumberFilter(field_name="department_id")
    country = django_filters.CharFilter(field_name="country", lookup_expr="iexact")
    employment_status = django_filters.CharFilter(field_name="employment_status")

    class Meta:
        model = Employee
        fields = ["department", "country", "employment_status"]
