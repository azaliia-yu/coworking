from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import BookingSettings, WorkingHours
from .serializers import BookingSettingsSerializer, WorkingHoursSerializer
from users.permissions import IsAdmin


class BookingSettingsViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdmin]
    serializer_class = BookingSettingsSerializer
    queryset = BookingSettings.objects.none()  

    def get_object(self):
        return BookingSettings.get_settings()

    def retrieve(self, request):
        settings = self.get_object()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

    def update(self, request):
        settings = self.get_object()
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkingHoursViewSet(viewsets.ModelViewSet):
    queryset = WorkingHours.objects.all()
    serializer_class = WorkingHoursSerializer
    permission_classes = [IsAdmin]
    # Убираем стандартный lookup_field по pk, будем искать по day
    lookup_field = 'day'
    lookup_value_regex = '[0-6]'  # только 0-6

    def get_object(self):
        """
        Переопределяем get_object для поиска по полю 'day' вместо 'pk'.
        """
        queryset = self.filter_queryset(self.get_queryset())
        # Используем lookup_field для фильтрации
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = queryset.get(**filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=['get'])
    def today(self, request):
        import datetime
        today = datetime.datetime.now().weekday()
        try:
            hours = WorkingHours.objects.get(day=today)
            serializer = self.get_serializer(hours)
            return Response(serializer.data)
        except WorkingHours.DoesNotExist:
            return Response(
                {'error': 'Настройки не найдены'},
                status=status.HTTP_404_NOT_FOUND
            )
