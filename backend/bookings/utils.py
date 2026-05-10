import math
from decimal import Decimal


def calculate_booking_cost(place, tariff, start_time, end_time):
    """
    Рассчитывает стоимость бронирования на основе тарифа и времени.
    """
    duration = end_time - start_time

    if tariff.type == 'hourly':
        hours = duration.total_seconds() / 3600
        if hours <= 0:
            hours = 1
        else:
            hours = math.ceil(hours)
        return Decimal(str(hours)) * tariff.price

    elif tariff.type == 'daily':
        days = (end_time.date() - start_time.date()).days + 1
        return Decimal(str(days)) * tariff.price

    elif tariff.type == 'monthly':
        months = (end_time.year - start_time.year) * 12 + end_time.month - start_time.month
        if months == 0:
            months = 1
        return Decimal(str(months)) * tariff.price

    elif tariff.type == 'package':
        # Для пакетных тарифов логика списания часов
        hours = duration.total_seconds() / 3600
        if hours > (tariff.package_hours or 0):
            return Decimal(str(tariff.package_hours)) * tariff.price
        return Decimal(str(hours)) * tariff.price

    return tariff.price
