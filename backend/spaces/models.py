from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from django.db import models
from django.conf import settings


class Space(models.Model):
    name = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    address = models.CharField(max_length=255, verbose_name='Адрес')
    total_places = models.PositiveIntegerField(default=0, verbose_name='Всего мест')
    image = models.ImageField(upload_to='spaces/', blank=True, null=True, verbose_name='Изображение')
    is_active = models.BooleanField(default=True, verbose_name='Активно')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    map_image = models.ImageField(
        upload_to='spaces/maps/',
        blank=True,
        null=True,
        verbose_name='План помещения'
        )
    version = models.IntegerField(default=0, editable=False, verbose_name='Версия')


    class Meta:
        verbose_name = 'Помещение'
        verbose_name_plural = 'Помещения'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Place(models.Model):
    PLACE_TYPE_CHOICES = (
        ('desk', 'Рабочее место'),
        ('meeting_room', 'Переговорная'),
    )

    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='places', verbose_name='Помещение')
    place_type = models.CharField(max_length=20, choices=PLACE_TYPE_CHOICES, db_column='type', verbose_name='Тип')
    name = models.CharField(max_length=100, verbose_name='Название')
    capacity = models.PositiveIntegerField(default=1, verbose_name='Вместимость')
    x = models.IntegerField(blank=True, null=True, help_text='Координата X на схеме', verbose_name='Координата X')
    y = models.IntegerField(blank=True, null=True, help_text='Координата Y на схеме', verbose_name='Координата Y')
    characteristics = models.JSONField(default=dict, blank=True, verbose_name='Характеристики')
    is_active = models.BooleanField(default=True, verbose_name='Активно')
    preview_image = models.ImageField(
        upload_to='places/preview/',
        blank=True,
        null=True,
        verbose_name='Превью (150x150)'
    )
    gallery_images = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Галерея фото (массив URL)'
    )
    base_tariff = models.ForeignKey(
        'tariffs.Tariff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='places_base',
        verbose_name='Базовый тариф'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    version = models.IntegerField(default=0, editable=False, verbose_name='Версия')


    class Meta:
        verbose_name = 'Место'
        verbose_name_plural = 'Места'
        ordering = ['space', 'name']

    def __str__(self):
        return f"{self.space.name} - {self.name}"

    def clean(self):
        if self.place_type == 'meeting_room' and self.capacity < 1:
            raise ValidationError('Вместимость переговорной должна быть не менее 1')
        if self.place_type == 'desk' and self.capacity != 1:
            self.capacity = 1

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


@receiver([post_save, post_delete], sender=Place)
def update_space_total_places(sender, instance, **kwargs):
    """
    Автоматически пересчитывает total_places в Space
    при любом сохранении или удалении Place.
    """
    space = instance.space
    new_total = Place.objects.filter(
        space=space,
        is_active=True
    ).count()
    Space.objects.filter(pk=space.pk).update(total_places=new_total)

class PlacePhoto(models.Model):
    """
    Фотографии места (галерея)
    """
    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name='Место'
    )
    image = models.ImageField(
        upload_to='places/gallery/',
        verbose_name='Фото'
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Порядок'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата добавления'
    )

    class Meta:
        verbose_name = 'Фото места'
        verbose_name_plural = 'Фото мест'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Фото для {self.place.name} #{self.order}"

class PlaceReview(models.Model):
    """
    Отзыв о рабочем месте / переговорной
    """
    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Место'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='place_reviews',
        verbose_name='Пользователь'
    )
    text = models.TextField(verbose_name='Текст отзыва')
    rating = models.PositiveSmallIntegerField(
        default=5,
        verbose_name='Оценка',
        choices=[(i, str(i)) for i in range(1, 6)]
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        ordering = ['-created_at']

    def __str__(self):
        return f'Отзыв от {self.user.email} на {self.place.name}'