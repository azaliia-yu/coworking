from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push-уведомление'),
    )
    STATUS_CHOICES = (
        ('pending', 'Ожидает'),
        ('sent', 'Отправлено'),
        ('failed', 'Ошибка'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name='notifications', verbose_name='Пользователь')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, verbose_name='Тип')
    subject = models.CharField(max_length=255, blank=True, verbose_name='Тема')
    content = models.TextField(verbose_name='Содержание')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES,
                              default='pending', verbose_name='Статус')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    sent_at = models.DateTimeField(blank=True, null=True, verbose_name='Дата отправки')
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')
    error_message = models.TextField(blank=True, verbose_name='Сообщение об ошибке')

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Notification #{self.id} - {self.user.email} - {self.get_type_display()}"

    def mark_as_read(self):
        """Отметить уведомление как прочитанное"""
        self.is_read = True
        self.save(update_fields=['is_read'])

    def mark_as_sent(self):
        """Отметить уведомление как отправленное"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])

    def mark_as_failed(self, error_message=''):
        """Отметить уведомление как ошибочное"""
        self.status = 'failed'
        self.error_message = error_message
        self.save(update_fields=['status', 'error_message'])
