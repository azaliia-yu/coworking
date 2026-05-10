import csv
import json
import io
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from django.db.models import Count, Sum, Q, Avg
from django.core.files.base import ContentFile
from bookings.models import Booking
from spaces.models import Space, Place
from users.models import User
from .models import Report
import logging

logger = logging.getLogger(__name__)


def generate_occupancy_report(start_date, end_date, space_id=None):
    """
    Генерация отчета по загрузке помещений
    """
    date_range = []
    current = start_date
    while current <= end_date:
        date_range.append(current)
        current += timedelta(days=1)

    spaces = Space.objects.filter(is_active=True)
    if space_id:
        spaces = spaces.filter(id=space_id)

    data = []
    total_places = 0
    total_bookings = 0
    total_hours = 0

    for space in spaces:
        places_count = space.places.filter(is_active=True).count()
        total_places += places_count

        bookings = Booking.objects.filter(
            place__space=space,
            start_time__date__gte=start_date,
            end_time__date__lte=end_date,
            status__in=['confirmed', 'completed']
        )

        space_bookings = bookings.count()
        total_bookings += space_bookings

        space_hours = sum(
            (b.end_time - b.start_time).total_seconds() / 3600
            for b in bookings
        )
        total_hours += space_hours

        occupancy_by_day = []
        for date in date_range:
            day_bookings = bookings.filter(
                start_time__date__lte=date,
                end_time__date__gte=date
            ).count()
            occupancy = (day_bookings / places_count * 100) if places_count > 0 else 0
            occupancy_by_day.append({
                'date': date.strftime('%Y-%m-%d'),
                'occupancy': round(occupancy, 2),
                'bookings': day_bookings
            })

        data.append({
            'space_id': space.id,
            'space_name': space.name,
            'total_places': places_count,
            'total_bookings': space_bookings,
            'total_hours': round(space_hours, 2),
            'avg_occupancy': round((space_bookings / places_count * 100) if places_count > 0 else 0, 2),
            'occupancy_by_day': occupancy_by_day
        })

    return {
        'total_spaces': len(spaces),
        'total_places': total_places,
        'total_bookings': total_bookings,
        'total_hours': round(total_hours, 2),
        'avg_overall_occupancy': round((total_bookings / total_places * 100) if total_places > 0 else 0, 2),
        'data': data
    }


def generate_revenue_report(start_date, end_date, space_id=None):
    """
    Генерация отчета по доходам
    """
    bookings = Booking.objects.filter(
        start_time__date__gte=start_date,
        end_time__date__lte=end_date,
        status__in=['confirmed', 'completed'],
        total_cost__isnull=False
    )

    if space_id:
        bookings = bookings.filter(place__space_id=space_id)

    revenue_by_day = []
    total_revenue = Decimal('0')
    current = start_date

    while current <= end_date:
        day_bookings = bookings.filter(start_time__date=current)
        day_revenue = day_bookings.aggregate(total=Sum('total_cost'))['total'] or Decimal('0')
        total_revenue += day_revenue

        revenue_by_day.append({
            'date': current.strftime('%Y-%m-%d'),
            'revenue': float(day_revenue),
            'bookings_count': day_bookings.count()
        })
        current += timedelta(days=1)

    # Статистика по тарифам
    tariff_stats = bookings.values('tariff__name', 'tariff__type').annotate(
        total=Sum('total_cost'),
        count=Count('id')
    ).order_by('-total')

    # Статистика по помещениям
    space_stats = bookings.values('place__space__name').annotate(
        total=Sum('total_cost'),
        count=Count('id')
    ).order_by('-total')

    return {
        'period': {
            'start': start_date.strftime('%Y-%m-%d'),
            'end': end_date.strftime('%Y-%m-%d'),
            'days': (end_date - start_date).days + 1
        },
        'total_revenue': float(total_revenue),
        'total_bookings': bookings.count(),
        'avg_check': float(total_revenue / bookings.count()) if bookings.count() > 0 else 0,
        'revenue_by_day': revenue_by_day,
        'by_tariff': list(tariff_stats),
        'by_space': list(space_stats)
    }


def generate_clients_report(start_date, end_date, space_id=None):
    """
    Генерация отчета по клиентам
    """
    bookings = Booking.objects.filter(
        start_time__date__gte=start_date,
        end_time__date__lte=end_date,
        status__in=['confirmed', 'completed']
    )

    if space_id:
        bookings = bookings.filter(place__space_id=space_id)

    # Новые клиенты за период
    new_clients = User.objects.filter(
        date_joined__date__gte=start_date,
        date_joined__date__lte=end_date,
        role='client'
    )

    # Активные клиенты (сделали хотя бы одно бронирование)
    active_client_ids = bookings.values_list('user_id', flat=True).distinct()
    active_clients = User.objects.filter(id__in=active_client_ids, role='client')

    # Статистика по клиентам
    clients_stats = []
    for client in active_clients[:50]:  # Топ 50 клиентов
        client_bookings = bookings.filter(user=client)
        clients_stats.append({
            'id': client.id,
            'email': client.email,
            'name': client.get_full_name(),
            'bookings_count': client_bookings.count(),
            'total_spent': float(client_bookings.aggregate(total=Sum('total_cost'))['total'] or 0),
            'total_hours': sum(
                (b.end_time - b.start_time).total_seconds() / 3600
                for b in client_bookings
            )
        })

    clients_stats.sort(key=lambda x: x['total_spent'], reverse=True)

    return {
        'period': {
            'start': start_date.strftime('%Y-%m-%d'),
            'end': end_date.strftime('%Y-%m-%d')
        },
        'new_clients': new_clients.count(),
        'active_clients': active_clients.count(),
        'total_clients': User.objects.filter(role='client').count(),
        'top_clients': clients_stats[:20]
    }


def generate_bookings_report(start_date, end_date, space_id=None, place_id=None):
    """
    Генерация отчета по бронированиям
    """
    bookings = Booking.objects.filter(
        start_time__date__gte=start_date,
        end_time__date__lte=end_date
    )

    if space_id:
        bookings = bookings.filter(place__space_id=space_id)
    if place_id:
        bookings = bookings.filter(place_id=place_id)

    # Статистика по статусам
    status_stats = bookings.values('status').annotate(count=Count('id'))

    # Статистика по часам
    hour_stats = {}
    for booking in bookings:
        hour = booking.start_time.hour
        hour_stats[hour] = hour_stats.get(hour, 0) + 1

    # Подробный список бронирований
    bookings_list = []
    for booking in bookings[:500]:  # Ограничиваем для производительности
        bookings_list.append({
            'id': booking.id,
            'user': booking.user.email,
            'user_name': booking.user.get_full_name(),
            'place': booking.place.name,
            'space': booking.place.space.name,
            'start_time': booking.start_time.isoformat(),
            'end_time': booking.end_time.isoformat(),
            'status': booking.status,
            'total_cost': float(booking.total_cost) if booking.total_cost else 0
        })

    return {
        'period': {
            'start': start_date.strftime('%Y-%m-%d'),
            'end': end_date.strftime('%Y-%m-%d')
        },
        'total_bookings': bookings.count(),
        'by_status': list(status_stats),
        'by_hour': [{'hour': h, 'count': c} for h, c in sorted(hour_stats.items())],
        'bookings': bookings_list
    }


def export_report_to_csv(report_data, report_type):
    """
    Экспорт отчета в CSV
    """
    output = io.StringIO()

    if report_type == 'occupancy':
        writer = csv.writer(output)
        writer.writerow(['Помещение', 'Всего мест', 'Бронирований', 'Часов', 'Средняя загрузка'])
        for space in report_data.get('data', []):
            writer.writerow([
                space['space_name'],
                space['total_places'],
                space['total_bookings'],
                space['total_hours'],
                f"{space['avg_occupancy']}%"
            ])

    elif report_type == 'revenue':
        writer = csv.writer(output)
        writer.writerow(['Дата', 'Выручка', 'Количество бронирований'])
        for day in report_data.get('revenue_by_day', []):
            writer.writerow([
                day['date'],
                day['revenue'],
                day['bookings_count']
            ])
        writer.writerow([])
        writer.writerow(['Итого:', report_data.get('total_revenue', 0), report_data.get('total_bookings', 0)])

    elif report_type == 'clients':
        writer = csv.writer(output)
        writer.writerow(['Клиент', 'Email', 'Бронирований', 'Потрачено', 'Часов'])
        for client in report_data.get('top_clients', []):
            writer.writerow([
                client['name'],
                client['email'],
                client['bookings_count'],
                client['total_spent'],
                round(client['total_hours'], 2)
            ])

    return output.getvalue().encode('utf-8')
