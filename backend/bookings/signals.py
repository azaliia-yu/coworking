from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Booking
from notifications.tasks import send_email_notification, create_notification

@receiver(post_save, sender=Booking)
def booking_post_save(sender, instance, created, **kwargs):
    if created:
        # Создаем уведомление о создании бронирования
        create_notification.delay(
            user_id=instance.user.id,
            type='email',
            subject='Бронирование создано',
            content=f'Ваше бронирование #{instance.id} создано и ожидает оплаты'
        )
