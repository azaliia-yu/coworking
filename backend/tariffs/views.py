from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Tariff, PlaceTariff
from .serializers import TariffSerializer, PlaceTariffSerializer
from users.permissions import IsAdmin


class TariffViewSet(viewsets.ModelViewSet):
    queryset = Tariff.objects.all()
    serializer_class = TariffSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name']
    ordering_fields = ['price', 'name', 'created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]


class PlaceTariffViewSet(viewsets.ModelViewSet):
    queryset = PlaceTariff.objects.all()
    serializer_class = PlaceTariffSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['place', 'tariff']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        place_id = self.request.query_params.get('place')
        if place_id:
            queryset = queryset.filter(place_id=place_id)
        return queryset