from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccessCardViewSet, AccessLogViewSet

router = DefaultRouter()
router.register(r'access-cards', AccessCardViewSet, basename='access-card')
router.register(r'access-logs', AccessLogViewSet, basename='access-log')

urlpatterns = [
    path('', include(router.urls)),
]
