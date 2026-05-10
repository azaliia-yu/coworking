from django.db import models
from django.core.exceptions import ValidationError


class Tariff(models.Model):
    TYPE_CHOICES = (
        ('hourly', 'Почасовой'),
        ('daily', 'Дневной'),
        ('monthly', 'Месячный'),
        ('package', 'Пакет часов'),
    )

    name = models.CharField(max_length=100, verbose_name='Название')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Тип')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')
    package_hours = models.PositiveIntegerField(blank=True, null=True,
                                                help_text='Для пакетных тарифов - количество часов',
                                                verbose_name='Часов в пакете')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    description = models.TextField(blank=True, verbose_name='Описание')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    version = models.IntegerField(default=0, editable=False, verbose_name='Версия')

    class Meta:
        verbose_name = 'Тариф'
        verbose_name_plural = 'Тарифы'
        ordering = ['type', 'price']

    def __str__(self):
        return self.name

    def clean(self):
        if self.type == 'package' and not self.package_hours:
            raise ValidationError('Для пакетного тарифа необходимо указать количество часов')
        if self.price < 0:
            raise ValidationError('Цена не может быть отрицательной')


class PlaceTariff(models.Model):
    place = models.ForeignKey('spaces.Place', on_delete=models.CASCADE,
                              related_name='place_tariffs', verbose_name='Место')
    tariff = models.ForeignKey(Tariff, on_delete=models.CASCADE,
                               related_name='place_tariffs', verbose_name='Тариф')
    custom_price = models.DecimalField(max_digits=10, decimal_places=2,
                                       blank=True, null=True, verbose_name='Индивидуальная цена')
    version = models.IntegerField(default=0, editable=False, verbose_name='Версия')


    class Meta:
        verbose_name = 'Тариф места'
        verbose_name_plural = 'Тарифы мест'
        unique_together = ('place', 'tariff')

    def __str__(self):
        price = self.custom_price or self.tariff.price
        return f"{self.place.name} - {self.tariff.name} ({price} ₽)"

    def get_price(self):
        return self.custom_price or self.tariff.price
