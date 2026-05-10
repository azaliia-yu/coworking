from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import AccessCard, AccessLog
from .serializers import AccessCardSerializer, AccessLogSerializer
from users.permissions import IsAdmin


class AccessCardViewSet(viewsets.ModelViewSet):
    queryset = AccessCard.objects.all()
    serializer_class = AccessCardSerializer

    def get_permissions(self):
        if self.action == 'my_card':
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_card(self, request):
        try:
            card = AccessCard.objects.get(user=request.user)
            serializer = self.get_serializer(card)
            return Response(serializer.data)
        except AccessCard.DoesNotExist:
            return Response({'error': 'Пропуск не найден'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def check_access(self, request):
        card_number = request.data.get('card_number')
        door = request.data.get('door', 'main')

        try:
            card = AccessCard.objects.get(card_number=card_number, is_active=True)
        except AccessCard.DoesNotExist:
            AccessLog.objects.create(
                card=None,
                event='denied',
                door=door,
                reason='Card not found'
            )
            return Response({'access': False, 'reason': 'Card not found'},
                            status=status.HTTP_403_FORBIDDEN)

        # Проверяем срок действия
        if card.expires_at and card.expires_at < timezone.now():
            AccessLog.objects.create(
                user=card.user,
                card=card,
                event='denied',
                door=door,
                reason='Card expired'
            )
            return Response({'access': False, 'reason': 'Card expired'},
                            status=status.HTTP_403_FORBIDDEN)

        # Проверяем активное бронирование
        from bookings.models import Booking
        now = timezone.now()
        active_booking = Booking.objects.filter(
            user=card.user,
            status='confirmed',
            start_time__lte=now,
            end_time__gte=now
        ).first()

        if not active_booking:
            AccessLog.objects.create(
                user=card.user,
                card=card,
                event='denied',
                door=door,
                reason='No active booking'
            )
            return Response({'access': False, 'reason': 'No active booking'},
                            status=status.HTTP_403_FORBIDDEN)

        # Отмечаем вход/выход
        if active_booking.check_in_time and not active_booking.check_out_time:
            active_booking.check_out_time = now
            active_booking.status = 'completed'
            active_booking.save()
            event = 'exit'
        else:
            active_booking.check_in_time = now
            active_booking.save()
            event = 'entry'

        card.last_used_at = now
        card.save()

        AccessLog.objects.create(
            user=card.user,
            card=card,
            event=event,
            door=door
        )

        return Response({
            'access': True,
            'event': event,
            'booking_id': active_booking.id,
            'place': active_booking.place.name
        })


class AccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AccessLog.objects.all()
    serializer_class = AccessLogSerializer

    def get_permissions(self):
        return [IsAdmin()]

