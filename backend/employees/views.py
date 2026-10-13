from datetime import timedelta

import django_filters.rest_framework as drf_filters
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import EmployeeFilter
from .models import Department, Employee, SalaryRecord
from .permissions import IsHRManager
from .serializers import (
    DepartmentSerializer,
    EmployeeDetailSerializer,
    EmployeeListSerializer,
    SalaryRecordSerializer,
)


class EmployeePagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class DepartmentListView(ListAPIView):
    permission_classes = [IsHRManager]
    serializer_class = DepartmentSerializer
    queryset = Department.objects.all()
    pagination_class = None  # Return all departments — small lookup table


class EmployeeListCreateView(ListCreateAPIView):
    permission_classes = [IsHRManager]
    pagination_class = EmployeePagination
    filter_backends = [drf_filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = EmployeeFilter
    search_fields = ["first_name", "last_name", "email", "employee_code"]
    ordering_fields = ["last_name", "first_name", "employee_code", "date_joined", "country"]
    ordering = ["last_name", "first_name"]

    def get_queryset(self):
        return Employee.objects.select_related("department").prefetch_related("salaries")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return EmployeeDetailSerializer
        return EmployeeListSerializer


class EmployeeDetailView(RetrieveUpdateAPIView):
    permission_classes = [IsHRManager]
    serializer_class = EmployeeDetailSerializer
    queryset = Employee.objects.select_related("department")
    http_method_names = ["get", "patch", "head", "options"]


class SalaryListCreateView(APIView):
    permission_classes = [IsHRManager]

    def get_employee(self, employee_pk):
        return get_object_or_404(Employee, pk=employee_pk)

    def get(self, request, employee_pk):
        employee = self.get_employee(employee_pk)
        serializer = SalaryRecordSerializer(employee.salaries.all(), many=True)
        return Response(serializer.data)

    def post(self, request, employee_pk):
        employee = self.get_employee(employee_pk)
        data = {**request.data, "employee": employee.pk}
        serializer = SalaryRecordSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        effective_from = serializer.validated_data["effective_from"]
        effective_to = serializer.validated_data.get("effective_to")

        with transaction.atomic():
            if effective_to is None:
                # New open-ended record — close the existing current salary
                current = (
                    SalaryRecord.objects.filter(employee=employee, effective_to__isnull=True)
                    .select_for_update()
                    .first()
                )
                if current:
                    current.effective_to = effective_from - timedelta(days=1)
                    current.save(update_fields=["effective_to", "updated_at"])

            salary = serializer.save()

        return Response(SalaryRecordSerializer(salary).data, status=status.HTTP_201_CREATED)
