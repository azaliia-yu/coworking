from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Payment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'В обработке'),
        ('success', 'Успешно'),
        ('failed', 'Ошибка'),
        ('refunded', 'Возвращен'),
    )
    METHOD_CHOICES = (
        ('card', 'Банковская карта'),
        ('sbp', 'СБП'),
        ('balance', 'С баланса'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name='payments', verbose_name='Пользователь')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL,
                                null=True, blank=True, related_name='payments',
                                verbose_name='Бронирование')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Сумма')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES,
                              default='pending', verbose_name='Статус')
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES,
                                      verbose_name='Способ оплаты')
    transaction_id = models.CharField(max_length=255, unique=True, blank=True, null=True, default=None, verbose_name='ID транзакции')
    payment_url = models.URLField(blank=True, verbose_name='Ссылка на оплату')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Платеж'
        verbose_name_plural = 'Платежи'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.id} - {self.user.email} - {self.amount} ₽"

    def clean(self):
        if self.amount <= 0:
            raise ValidationError('Сумма платежа должна быть положительной')


class Invoice(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name='invoices', verbose_name='Пользователь')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL,
                                null=True, blank=True, related_name='invoices',
                                verbose_name='Бронирование')
    payment = models.OneToOneField(Payment, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='invoice',
                                   verbose_name='Платеж')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Сумма')
    issued_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата выставления')
    paid_at = models.DateTimeField(blank=True, null=True, verbose_name='Дата оплаты')
    invoice_number = models.CharField(max_length=50, unique=True, blank=True,
                                      verbose_name='Номер счета')

    class Meta:
        verbose_name = 'Счет'
        verbose_name_plural = 'Счета'
        ordering = ['-issued_at']

    def __str__(self):
        return f"Invoice #{self.id} - {self.user.email} - {self.amount} ₽"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            import uuid
            self.invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
