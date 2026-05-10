from django.urls import path
from .views import DashboardStatsView, RevenueStatsView, OccupancyChartView

urlpatterns = [
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/revenue/', RevenueStatsView.as_view(), name='dashboard-revenue'),
    path('dashboard/occupancy-chart/', OccupancyChartView.as_view(), name='dashboard-occupancy-chart'),
]
