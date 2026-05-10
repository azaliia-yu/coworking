from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from .models import Notification
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_email_notification(notification_id):
    """
    Отправка email уведомления
    """
    try:
        notification = Notification.objects.get(id=notification_id)

        if notification.type != 'email':
            logger.warning(f"Notification {notification_id} is not email type")
            return

        send_mail(
            subject=notification.subject or 'Уведомление от Коворкинга',
            message=notification.content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification.user.email],
            fail_silently=False,
        )

        notification.status = 'sent'
        notification.sent_at = timezone.now()
        notification.save()
        logger.info(f"Email notification {notification_id} sent to {notification.user.email}")

    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
    except Exception as e:
        logger.error(f"Failed to send email notification {notification_id}: {e}")
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.status = 'failed'
            notification.error_message = str(e)
            notification.save()
        except Notification.DoesNotExist:
            pass


@shared_task
def create_notification(user_id, type, subject='', content=''):
    """
    Создание уведомления
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        user = User.objects.get(id=user_id)
        notification = Notification.objects.create(
            user=user,
            type=type,
            subject=subject,
            content=content,
            status='pending'
        )

        # Отправляем уведомление сразу
        if type == 'email':
            send_email_notification.delay(notification.id)

        return notification.id
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for notification")
        return None


@shared_task
def send_booking_reminders():
    """
    Отправка напоминаний о предстоящих бронированиях
    """
    from datetime import timedelta
    from django.utils import timezone
    from bookings.models import Booking

    now = timezone.now()
    reminder_time = now + timedelta(hours=1)

    upcoming_bookings = Booking.objects.filter(
        start_time__gte=now,
        start_time__lte=reminder_time,
        status='confirmed',
        user__is_active=True
    )

    for booking in upcoming_bookings:
        create_notification.delay(
            user_id=booking.user.id,
            type='email',
            subject='Напоминание о бронировании',
            content=f'Напоминаем, что через час у вас забронировано место "{booking.place.name}".'
        )
        logger.info(f"Reminder sent for booking {booking.id}")


@shared_task
def send_booking_confirmation(booking_id):
    """
    Отправка подтверждения бронирования
    """
    from bookings.models import Booking

    try:
        booking = Booking.objects.get(id=booking_id)
        create_notification.delay(
            user_id=booking.user.id,
            type='email',
            subject='Подтверждение бронирования',
            content=f'Ваше бронирование #{booking.id} подтверждено. '
                    f'Место: {booking.place.name}. '
                    f'Время: {booking.start_time.strftime("%d.%m.%Y %H:%M")} - '
                    f'{booking.end_time.strftime("%d.%m.%Y %H:%M")}. '
                    f'Стоимость: {booking.total_cost} ₽.'
        )
        logger.info(f"Confirmation sent for booking {booking_id}")
    except Booking.DoesNotExist:
        logger.error(f"Booking {booking_id} not found")
