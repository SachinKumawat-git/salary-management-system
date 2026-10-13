from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/summary/", views.DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("analytics/salaries/", views.SalaryAnalyticsView.as_view(), name="salary-analytics"),
]
