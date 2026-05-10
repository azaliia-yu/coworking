from django.db import models
from django.conf import settings
import uuid


class AccessCard(models.Model):
    """
    Электронный пропуск
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='access_card', verbose_name='Пользователь')
    card_number = models.CharField(max_length=50, unique=True, verbose_name='Номер карты')
    pin_code = models.CharField(max_length=10, blank=True, verbose_name='PIN-код')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    issued_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата выдачи')
    expires_at = models.DateTimeField(blank=True, null=True, verbose_name='Срок действия')
    last_used_at = models.DateTimeField(blank=True, null=True, verbose_name='Последнее использование')

    class Meta:
        verbose_name = 'Пропуск'
        verbose_name_plural = 'Пропуски'

    def __str__(self):
        return f"Card {self.card_number} - {self.user.email}"

    def save(self, *args, **kwargs):
        if not self.card_number:
            self.card_number = str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)


class AccessLog(models.Model):
    """
    Лог доступа
    """
    EVENT_CHOICES = (
        ('entry', 'Вход'),
        ('exit', 'Выход'),
        ('denied', 'Отказ'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name='access_logs', verbose_name='Пользователь')
    card = models.ForeignKey(AccessCard, on_delete=models.CASCADE,
                             related_name='logs', verbose_name='Пропуск')
    event = models.CharField(max_length=10, choices=EVENT_CHOICES, verbose_name='Событие')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Время')
    door = models.CharField(max_length=50, blank=True, verbose_name='Дверь')
    reason = models.CharField(max_length=255, blank=True, verbose_name='Причина')

    class Meta:
        verbose_name = 'Лог доступа'
        verbose_name_plural = 'Логи доступа'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.get_event_display()} - {self.user.email} at {self.timestamp}"
