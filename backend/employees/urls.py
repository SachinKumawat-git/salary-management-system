from django.urls import path

from . import views

urlpatterns = [
    path("departments/", views.DepartmentListView.as_view(), name="department-list"),
    path("employees/", views.EmployeeListCreateView.as_view(), name="employee-list"),
    path("employees/<int:pk>/", views.EmployeeDetailView.as_view(), name="employee-detail"),
    path(
        "employees/<int:employee_pk>/salaries/",
        views.SalaryListCreateView.as_view(),
        name="salary-list",
    ),
]
