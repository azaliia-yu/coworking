from rest_framework import serializers
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import Booking
from .utils import calculate_booking_cost
from spaces.serializers import PlaceSerializer
from tariffs.serializers import TariffSerializer
from settings.models import BookingSettings, WorkingHours
from datetime import datetime, timedelta


def validate_booking_rules(place, start_time, end_time, user, exclude_booking_id=None):
    """Единая функция проверки правил бронирования"""
    settings = BookingSettings.get_settings()

    # Проверка минимальной длительности
    duration_minutes = (end_time - start_time).total_seconds() / 60
    if duration_minutes < settings.min_booking_duration:
        raise ValidationError(
            f'Минимальная длительность бронирования: {settings.min_booking_duration} минут'
        )

    # Проверка максимальной длительности
    if duration_minutes > settings.max_booking_duration:
        raise ValidationError(
            f'Максимальная длительность бронирования: {settings.max_booking_duration} минут'
        )

    # Проверка максимального срока бронирования
    max_date = timezone.now() + timedelta(days=settings.advance_booking_days)
    if start_time > max_date:
        raise ValidationError(
            f'Максимальный срок бронирования: {settings.advance_booking_days} дней'
        )

    # Проверка рабочего времени
    day_of_week = start_time.weekday()
    try:
        working_hours = WorkingHours.objects.get(day=day_of_week)
        if working_hours.is_working:
            start_hour = start_time.hour * 60 + start_time.minute
            end_hour = end_time.hour * 60 + end_time.minute
            work_start = working_hours.start_time.hour * 60 + working_hours.start_time.minute
            work_end = working_hours.end_time.hour * 60 + working_hours.end_time.minute

            if start_hour < work_start or end_hour > work_end:
                raise ValidationError(
                    f'Бронирование возможно только в рабочее время: '
                    f'{working_hours.start_time} - {working_hours.end_time}'
                )
    except WorkingHours.DoesNotExist:
        pass

    # Проверка одновременных бронирований
    if not settings.allow_simultaneous_bookings:
        from bookings.models import Booking
        active_bookings = Booking.objects.filter(
            user=user,
            status__in=['pending', 'confirmed'],
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        if exclude_booking_id:
            active_bookings = active_bookings.exclude(id=exclude_booking_id)

        if active_bookings.count() >= settings.max_simultaneous_bookings:
            raise ValidationError(
                f'Максимальное количество одновременных бронирований: '
                f'{settings.max_simultaneous_bookings}'
            )

    return True


class BookingSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    place_name = serializers.CharField(source='place.name', read_only=True)
    place_info = PlaceSerializer(source='place', read_only=True)
    tariff_name = serializers.CharField(source='tariff.name', read_only=True)
    tariff_info = TariffSerializer(source='tariff', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'user', 'user_email', 'user_name', 'place', 'place_name', 'place_info',
            'tariff', 'tariff_name', 'tariff_info', 'start_time', 'end_time',
            'status', 'status_display', 'total_cost', 'check_in_time', 'check_out_time',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'user', 'total_cost', 'created_at', 'updated_at',
            'check_in_time', 'check_out_time'
        )

    def validate(self, data):
        place = data.get('place')
        start = data.get('start_time')
        end = data.get('end_time')
        user = self.context['request'].user

        if not start or not end:
            raise serializers.ValidationError({
                'error': 'Необходимо указать время начала и окончания'
            })

        if start >= end:
            raise serializers.ValidationError({
                'end_time': 'Время окончания должно быть позже времени начала'
            })

        if start < timezone.now():
            raise serializers.ValidationError({
                'start_time': 'Нельзя бронировать место в прошлом'
            })

        # Проверка пересечений с другими бронированиями
        overlapping = Booking.objects.filter(
            place=place,
            status__in=['pending', 'confirmed'],
            start_time__lt=end,
            end_time__gt=start
        )
        if self.instance:
            overlapping = overlapping.exclude(id=self.instance.id)

        if overlapping.exists():
            raise serializers.ValidationError(
                'Это место уже забронировано на выбранное время'
            )

        # Проверка правил бронирования (ЕДИНАЯ ФУНКЦИЯ)
        try:
            validate_booking_rules(
                place, start, end, user,
                exclude_booking_id=self.instance.id if self.instance else None
            )
        except ValidationError as e:
            raise serializers.ValidationError({'error': str(e)})

        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user

        tariff = validated_data.get('tariff')
        if not tariff:
            place = validated_data['place']
            tariff = place.base_tariff
            if not tariff and place.place_tariffs.exists():
                tariff = place.place_tariffs.first().tariff
            if not tariff:
                raise serializers.ValidationError(
                    'Не удалось определить тариф для бронирования'
                )

        validated_data['tariff'] = tariff
        start = validated_data['start_time']
        end = validated_data['end_time']
        validated_data['total_cost'] = calculate_booking_cost(
            validated_data['place'], tariff, start, end
        )

        return super().create(validated_data)


class BookingAdminSerializer(BookingSerializer):
    class Meta(BookingSerializer.Meta):
        fields = BookingSerializer.Meta.fields
        read_only_fields = BookingSerializer.Meta.read_only_fields
