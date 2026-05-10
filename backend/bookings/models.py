from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Ожидает подтверждения'),
        ('confirmed', 'Подтверждено'),
        ('cancelled', 'Отменено'),
        ('completed', 'Завершено'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name='bookings', verbose_name='Пользователь')
    place = models.ForeignKey('spaces.Place', on_delete=models.CASCADE,
                              related_name='bookings', verbose_name='Место')
    tariff = models.ForeignKey('tariffs.Tariff', on_delete=models.SET_NULL,
                               null=True, verbose_name='Тариф')
    start_time = models.DateTimeField(verbose_name='Время начала')
    end_time = models.DateTimeField(verbose_name='Время окончания')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES,
                              default='pending', verbose_name='Статус')
    total_cost = models.DecimalField(max_digits=10, decimal_places=2,
                                     blank=True, null=True, verbose_name='Стоимость')
    check_in_time = models.DateTimeField(blank=True, null=True, verbose_name='Время входа')
    check_out_time = models.DateTimeField(blank=True, null=True, verbose_name='Время выхода')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Бронирование'
        verbose_name_plural = 'Бронирования'
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['start_time', 'end_time']),
            models.Index(fields=['status']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"Booking #{self.id} - {self.user.email} - {self.place.name}"

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError('Время окончания должно быть позже времени начала')

        if self.start_time < timezone.now():
            raise ValidationError('Нельзя бронировать место в прошлом')

        # Проверка пересечений с другими бронированиями
        overlapping = Booking.objects.filter(
            place=self.place,
            status__in=['pending', 'confirmed'],
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        ).exclude(id=self.id)

        if overlapping.exists():
            raise ValidationError('Это место уже забронировано на выбранное время')

    def save(self, *args, **kwargs):
        # Вызываем полную валидацию перед сохранением
        self.full_clean()

        if not self.total_cost and self.tariff:
            from bookings.utils import calculate_booking_cost
            self.total_cost = calculate_booking_cost(self.place, self.tariff,
                                                     self.start_time, self.end_time)

        super().save(*args, **kwargs)
