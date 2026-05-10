from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingSettingsViewSet, WorkingHoursViewSet

router = DefaultRouter()
router.register(r'working-hours', WorkingHoursViewSet, basename='working-hours')

urlpatterns = [
    path('booking-settings/', BookingSettingsViewSet.as_view({'get': 'retrieve', 'put': 'update'}), name='booking-settings'),
    path('', include(router.urls)),
]