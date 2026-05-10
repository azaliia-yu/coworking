from django.db import models
from django.core.cache import cache


class BookingSettings(models.Model):
    """
    Настройки правил бронирования
    """
    min_booking_duration = models.PositiveIntegerField(
        default=30,
        verbose_name='Минимальная длительность бронирования (минуты)'
    )
    max_booking_duration = models.PositiveIntegerField(
        default=1440,
        verbose_name='Максимальная длительность бронирования (минуты)'
    )
    booking_interval = models.PositiveIntegerField(
        default=15,
        verbose_name='Интервал бронирования (минуты)'
    )
    advance_booking_days = models.PositiveIntegerField(
        default=30,
        verbose_name='Максимальный срок бронирования (дни)'
    )
    cancellation_deadline_minutes = models.PositiveIntegerField(
        default=120,
        verbose_name='Время для отмены бронирования (минуты)'
    )
    allow_simultaneous_bookings = models.BooleanField(
        default=False,
        verbose_name='Разрешить одновременные бронирования'
    )
    max_simultaneous_bookings = models.PositiveIntegerField(
        default=1,
        verbose_name='Максимум одновременных бронирований'
    )
    auto_cancel_unpaid_minutes = models.PositiveIntegerField(
        default=30,
        verbose_name='Автоотмена неоплаченных бронирований (минуты)'
    )
    enable_notifications = models.BooleanField(
        default=True,
        verbose_name='Включить уведомления'
    )
    reminder_minutes_before = models.PositiveIntegerField(
        default=60,
        verbose_name='Напоминание за (минуты)'
    )
    version = models.IntegerField(default=0, editable=False, verbose_name='Версия')

    class Meta:
        verbose_name = 'Настройки бронирования'
        verbose_name_plural = 'Настройки бронирования'

    def __str__(self):
        return "Настройки бронирования"

    def save(self, *args, **kwargs):
        if not self.pk and BookingSettings.objects.exists():
            raise ValueError('Может существовать только одна запись настроек')
        super().save(*args, **kwargs)
        # Очищаем кэш
        cache.delete('booking_settings')

    @classmethod
    def get_settings(cls):
        settings = cache.get('booking_settings')
        if not settings:
            settings = cls.objects.first()
            if not settings:
                settings = cls.objects.create()
            cache.set('booking_settings', settings, 3600)
        return settings


class WorkingHours(models.Model):
    """
    Рабочие часы
    """
    DAY_CHOICES = [
        (0, 'Понедельник'),
        (1, 'Вторник'),
        (2, 'Среда'),
        (3, 'Четверг'),
        (4, 'Пятница'),
        (5, 'Суббота'),
        (6, 'Воскресенье'),
    ]

    day = models.IntegerField(choices=DAY_CHOICES, unique=True, verbose_name='День недели')
    start_time = models.TimeField(verbose_name='Начало работы')
    end_time = models.TimeField(verbose_name='Окончание работы')
    is_working = models.BooleanField(default=True, verbose_name='Рабочий день')
    version = models.IntegerField(default=0, editable=False, verbose_name='Версия')
    
    class Meta:
        verbose_name = 'Рабочие часы'
        verbose_name_plural = 'Рабочие часы'
        ordering = ['day']

    def __str__(self):
        return f"{self.get_day_display()}: {self.start_time} - {self.end_time}"
