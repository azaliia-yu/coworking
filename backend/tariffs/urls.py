from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TariffViewSet, PlaceTariffViewSet

router = DefaultRouter()
router.register(r'tariffs', TariffViewSet, basename='tariff')
router.register(r'place-tariffs', PlaceTariffViewSet, basename='place-tariff')

urlpatterns = [
    path('', include(router.urls)),
]
