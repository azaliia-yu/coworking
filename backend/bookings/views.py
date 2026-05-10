from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Booking
from .serializers import BookingSerializer, BookingAdminSerializer
from users.permissions import IsAdmin
from settings.models import BookingSettings
from datetime import timedelta


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'place', 'place__space']
    ordering_fields = ['start_time', 'created_at', 'total_cost']
    ordering = ['-start_time']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Booking.objects.none()
        user = self.request.user
        if not user.is_authenticated:
            return Booking.objects.none()
        if user.role == 'admin':
            return Booking.objects.all()
        return Booking.objects.filter(user=user)
        
    def get_serializer_class(self):
        if getattr(self, 'swagger_fake_view', False):
            return BookingSerializer
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return BookingAdminSerializer
        return BookingSerializer
        
    def get_permissions(self):
        if self.action == 'check_availability':
            return [permissions.AllowAny()]
        if self.action in ['create', 'cancel']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]  # всё остальное — только авторизованным

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        now = timezone.now()

        if booking.start_time <= now:
            return Response(
                {'error': 'Нельзя отменить уже начавшееся или завершившееся бронирование'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверка дедлайна отмены
        settings = BookingSettings.get_settings()
        cancellation_deadline = booking.start_time - timedelta(
            minutes=settings.cancellation_deadline_minutes
        )

        if now > cancellation_deadline:
            return Response(
                {
                    'error': f'Отмена возможна не позднее чем за '
                             f'{settings.cancellation_deadline_minutes} минут до начала'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Отменяем бронирование
        booking.status = 'cancelled'
        booking.save()

        # Возврат средств
        from payments.services import refund_booking_payment
        refund_booking_payment(booking)

        return Response({
            'status': 'cancelled',
            'booking_id': booking.id,
            'message': 'Бронирование отменено'
        })

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        booking = self.get_object()

        if booking.status != 'confirmed':
            return Response(
                {'error': 'Только подтвержденные бронирования могут быть активированы'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.check_in_time:
            return Response(
                {'error': 'Уже отмечено посещение'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.check_in_time = timezone.now()
        booking.save()

        return Response({
            'status': 'checked_in',
            'check_in_time': booking.check_in_time
        })

    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        booking = self.get_object()

        if not booking.check_in_time:
            return Response(
                {'error': 'Сначала необходимо отметить вход'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.check_out_time:
            return Response(
                {'error': 'Уже отмечен выход'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.check_out_time = timezone.now()

        # Пересчет стоимости если был почасовой тариф
        if booking.tariff and booking.tariff.type == 'hourly':
            from .utils import calculate_booking_cost
            booking.total_cost = calculate_booking_cost(
                booking.place, booking.tariff,
                booking.check_in_time, booking.check_out_time
            )

        booking.status = 'completed'
        booking.save()

        return Response({
            'status': 'checked_out',
            'total_cost': booking.total_cost
        })

    @action(detail=False, methods=['get'])
    def check_availability(self, request):
        place_id = request.query_params.get('place_id')
        start = request.query_params.get('start')
        end = request.query_params.get('end')

        if not all([place_id, start, end]):
            return Response(
                {'error': 'Необходимо указать place_id, start и end'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_time = timezone.datetime.fromisoformat(start)
            end_time = timezone.datetime.fromisoformat(end)
        except ValueError:
            return Response(
                {'error': 'Неверный формат даты'},
                status=status.HTTP_400_BAD_REQUEST
            )

        overlapping = Booking.objects.filter(
            place_id=place_id,
            status__in=['pending', 'confirmed'],
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exists()

        return Response({'available': not overlapping})
