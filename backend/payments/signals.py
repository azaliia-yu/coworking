from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Payment

@receiver(post_save, sender=Payment)
def payment_post_save(sender, instance, created, **kwargs):
    # Никакого автоматического изменения статуса бронирования здесь быть не должно.
    # Статус меняется только в services.py (process_balance_payment / process_successful_payment)
    pass