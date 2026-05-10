from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Report(models.Model):
    TYPE_CHOICES = (
        ('occupancy', 'Загрузка помещений'),
        ('revenue', 'Доходы'),
        ('clients', 'Клиенты'),
        ('bookings', 'Бронирования'),
    )
    FORMAT_CHOICES = (
        ('json', 'JSON'),
        ('csv', 'CSV'),
        ('pdf', 'PDF'),
    )

    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              limit_choices_to={'role': 'admin'}, verbose_name='Администратор')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Тип отчета')
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='json',
                              verbose_name='Формат')
    parameters = models.JSONField(default=dict, verbose_name='Параметры')
    file = models.FileField(upload_to='reports/%Y/%m/%d/', blank=True, null=True,
                            verbose_name='Файл')
    status = models.CharField(max_length=20, default='pending',
                              choices=[('pending', 'В очереди'), ('processing', 'Генерация'),
                                       ('completed', 'Готов'), ('failed', 'Ошибка')],
                              verbose_name='Статус')
    error_message = models.TextField(blank=True, verbose_name='Сообщение об ошибке')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Дата завершения')

    class Meta:
        verbose_name = 'Отчет'
        verbose_name_plural = 'Отчеты'
        ordering = ['-created_at']

    def __str__(self):
        return f"Report #{self.id} - {self.get_type_display()} - {self.created_at.strftime('%Y-%m-%d')}"

    def save(self, *args, **kwargs):
        if not self.admin_id and hasattr(self, '_current_user'):
            self.admin = self._current_user
        super().save(*args, **kwargs)
