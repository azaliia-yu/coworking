from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Payment

@receiver(post_save, sender=Payment)
def payment_post_save(sender, instance, created, **kwargs):
    if created and instance.payment_method == 'balance':
        # Логика для оплаты с баланса
        if instance.booking:
            instance.booking.status = 'confirmed'
            instance.booking.save()
