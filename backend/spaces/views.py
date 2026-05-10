from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response                    
from django_filters.rest_framework import DjangoFilterBackend
from .models import Space, Place                                 
from .serializers import SpaceSerializer, SpaceDetailSerializer, PlaceSerializer, PlaceReviewSerializer
from users.permissions import IsAdmin, IsAdminOrReadOnly
from rest_framework.decorators import action

class SpaceViewSet(viewsets.ModelViewSet):
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'address']
    ordering_fields = ['name', 'created_at', 'total_places']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SpaceDetailSerializer
        return SpaceSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAdminOrReadOnly()]


class PlaceViewSet(viewsets.ModelViewSet):
    queryset = Place.objects.all()
    serializer_class = PlaceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['space', 'place_type', 'is_active', 'capacity']
    search_fields = ['name']
    ordering_fields = ['name', 'capacity', 'created_at']

    @action(detail=True, methods=['get'])
    def tariffs(self, request, pk=None):
        place = self.get_object()
        tariffs = place.place_tariffs.select_related('tariff').all()
        data = []
        for pt in tariffs:
            tariff = pt.tariff
            data.append({
                'id': tariff.id,
                'name': tariff.name,
                'type': tariff.type,
                'price': pt.get_price(),
                'description': tariff.description,
                'is_active': tariff.is_active,
                'package_hours': tariff.package_hours,
                'custom_price': pt.custom_price,
            })
        return Response(data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def reviews(self, request, pk=None):
        """Получить список отзывов о месте"""
        place = self.get_object()
        reviews = place.reviews.all()
        serializer = PlaceReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)

    @reviews.mapping.post
    def add_review(self, request, pk=None):
        """Добавить отзыв (только авторизованные)"""
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Необходимо войти'}, status=401)
        place = self.get_object()
        serializer = PlaceReviewSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(place=place, user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def get_queryset(self):
        queryset = super().get_queryset()
        space_id = self.request.query_params.get('space')
        if space_id:
            queryset = queryset.filter(space_id=space_id)
        return queryset
    
    
    def get_permissions(self):
        if self.action == 'reviews':
            return [permissions.AllowAny()]
        if self.action == 'add_review':
            return [permissions.IsAuthenticated()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAdminOrReadOnly()]