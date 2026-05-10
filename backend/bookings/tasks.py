from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Booking
from settings.models import BookingSettings
from notifications.tasks import create_notification


@shared_task
def auto_cancel_unpaid_bookings():
    settings = BookingSettings.get_settings()
    deadline = timezone.now() - timedelta(minutes=settings.auto_cancel_unpaid_minutes)

    bookings = Booking.objects.filter(
        status='pending',
        created_at__lte=deadline
    )

    for booking in bookings:
        # Обновляем статус без полной валидации
        Booking.objects.filter(id=booking.id).update(status='cancelled')

    # Отправляем уведомления
    for booking in bookings:
        create_notification.delay(
            user_id=booking.user.id,
            type='email',
            subject='Бронирование отменено',
            content=f'Ваше бронирование #{booking.id} было автоматически отменено в связи с неоплатой.'
        )


@shared_task
def auto_complete_past_bookings():
    """Автоматически завершает подтверждённые бронирования, у которых истекло время окончания."""
    now = timezone.now()
    updated_count = Booking.objects.filter(
        status='confirmed',
        end_time__lt=now
    ).update(status='completed')

    return updated_count
    