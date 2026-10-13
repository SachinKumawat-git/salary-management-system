from django.db.models import Avg, Count, Max, Min
from rest_framework.response import Response
from rest_framework.views import APIView

from employees.models import Employee, SalaryRecord
from employees.permissions import IsHRManager


class DashboardSummaryView(APIView):
    permission_classes = [IsHRManager]

    def get(self, request):
        total_employees = Employee.objects.count()
        active_employees = Employee.objects.filter(employment_status=Employee.EmploymentStatus.ACTIVE).count()

        # Department breakdown
        dept_stats = list(
            Employee.objects.values("department__name").annotate(employee_count=Count("id")).order_by("-employee_count")
        )

        # Country breakdown
        country_stats = list(
            Employee.objects.values("country").annotate(employee_count=Count("id")).order_by("-employee_count")
        )

        # Average current salary per currency (only active/open-ended records)
        salary_averages = list(
            SalaryRecord.objects.filter(effective_to__isnull=True)
            .values("currency")
            .annotate(
                avg_base_salary=Avg("base_salary"),
                avg_bonus=Avg("bonus"),
                employee_count=Count("id"),
            )
            .order_by("currency")
        )

        return Response(
            {
                "total_employees": total_employees,
                "active_employees": active_employees,
                "salary_averages": salary_averages,
                "department_breakdown": dept_stats,
                "country_breakdown": country_stats,
            }
        )


class SalaryAnalyticsView(APIView):
    permission_classes = [IsHRManager]

    def get(self, request):
        department_id = request.query_params.get("department")
        country = request.query_params.get("country")
        currency = request.query_params.get("currency")

        # Base queryset: current salaries only
        qs = SalaryRecord.objects.filter(effective_to__isnull=True)

        if department_id:
            qs = qs.filter(employee__department_id=department_id)
        if country:
            qs = qs.filter(employee__country__iexact=country)
        if currency:
            qs = qs.filter(currency__iexact=currency)

        # Department-level stats, grouped by currency to avoid mixing
        by_department = list(
            qs.values("employee__department__name", "currency")
            .annotate(
                employee_count=Count("id"),
                avg_salary=Avg("base_salary"),
                min_salary=Min("base_salary"),
                max_salary=Max("base_salary"),
                avg_bonus=Avg("bonus"),
            )
            .order_by("employee__department__name", "currency")
        )

        # Country-level stats, grouped by currency
        by_country = list(
            qs.values("employee__country", "currency")
            .annotate(
                employee_count=Count("id"),
                avg_salary=Avg("base_salary"),
                min_salary=Min("base_salary"),
                max_salary=Max("base_salary"),
            )
            .order_by("employee__country", "currency")
        )

        return Response(
            {
                "by_department": by_department,
                "by_country": by_country,
            }
        )
