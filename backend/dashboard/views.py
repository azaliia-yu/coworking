from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Sum, Q
from datetime import datetime, timedelta

from spaces.models import Space, Place
from bookings.models import Booking
from users.permissions import IsAdmin
from .serializers import DashboardStatsSerializer, OccupancyStatsSerializer, RevenueStatsSerializer


class DashboardStatsView(APIView):
    """Получение статистики для дашборда администратора"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        today = timezone.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        week_start = today - timedelta(days=7)
        month_start = today - timedelta(days=30)

        # Общая статистика
        total_spaces = Space.objects.filter(is_active=True).count()
        total_places = Place.objects.filter(is_active=True).count()

        # Бронирования за сегодня
        today_bookings = Booking.objects.filter(
            start_time__date=today,
            status__in=['confirmed', 'completed']
        )
        total_bookings_today = today_bookings.count()

        # Выручка за сегодня
        total_revenue_today = today_bookings.aggregate(
            total=Sum('total_cost')
        )['total'] or 0

        # Статистика по помещениям
        occupancy_by_space = []
        spaces = Space.objects.filter(is_active=True).prefetch_related('places')

        for space in spaces:
            places_in_space = space.places.filter(is_active=True).count()
            if places_in_space == 0:
                continue

            # Занятые места сейчас
            now = timezone.now()
            occupied_places = Booking.objects.filter(
                place__space=space,
                status='confirmed',
                start_time__lte=now,
                end_time__gte=now
            ).values('place').distinct().count()

            occupancy_percent = (occupied_places / places_in_space * 100) if places_in_space > 0 else 0

            occupancy_by_space.append({
                'space_id': space.id,
                'space_name': space.name,
                'total_places': places_in_space,
                'occupied_places': occupied_places,
                'occupancy_percent': round(occupancy_percent, 1),
                'today_bookings': Booking.objects.filter(
                    place__space=space,
                    start_time__date=today,
                    status__in=['confirmed', 'completed']
                ).count()
            })

        # Последние бронирования
        recent_bookings = Booking.objects.filter(
            status__in=['pending', 'confirmed', 'completed']
        ).select_related('user', 'place', 'place__space').order_by('-created_at')[:10]

        recent_bookings_data = []
        for booking in recent_bookings:
            recent_bookings_data.append({
                'id': booking.id,
                'user_email': booking.user.email,
                'user_name': booking.user.get_full_name(),
                'place_name': booking.place.name,
                'space_name': booking.place.space.name,
                'start_time': booking.start_time.isoformat(),
                'end_time': booking.end_time.isoformat(),
                'status': booking.status,
                'total_cost': float(booking.total_cost) if booking.total_cost else 0,
                'created_at': booking.created_at.isoformat()
            })

        data = {
            'total_spaces': total_spaces,
            'total_places': total_places,
            'total_bookings_today': total_bookings_today,
            'total_revenue_today': float(total_revenue_today),
            'occupancy_by_space': occupancy_by_space,
            'recent_bookings': recent_bookings_data
        }

        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class RevenueStatsView(APIView):
    """Получение статистики по выручке для дашборда"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        today = timezone.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        week_start = today - timedelta(days=7)
        month_start = today - timedelta(days=30)

        # Выручка за сегодня
        today_revenue = Booking.objects.filter(
            start_time__date=today,
            status__in=['confirmed', 'completed']
        ).aggregate(total=Sum('total_cost'))['total'] or 0

        # Выручка за неделю
        week_revenue = Booking.objects.filter(
            start_time__date__gte=week_start,
            status__in=['confirmed', 'completed']
        ).aggregate(total=Sum('total_cost'))['total'] or 0

        # Выручка за месяц
        month_revenue = Booking.objects.filter(
            start_time__date__gte=month_start,
            status__in=['confirmed', 'completed']
        ).aggregate(total=Sum('total_cost'))['total'] or 0

        # Средний чек за месяц
        month_bookings = Booking.objects.filter(
            start_time__date__gte=month_start,
            status__in=['confirmed', 'completed']
        )
        bookings_count = month_bookings.count()
        avg_check = month_revenue / bookings_count if bookings_count > 0 else 0

        # Данные для графика (последние 7 дней)
        chart_data = []
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            day_revenue = Booking.objects.filter(
                start_time__date=date,
                status__in=['confirmed', 'completed']
            ).aggregate(total=Sum('total_cost'))['total'] or 0
            chart_data.append({
                'date': date.strftime('%d.%m'),
                'revenue': float(day_revenue)
            })

        data = {
            'today_revenue': float(today_revenue),
            'week_revenue': float(week_revenue),
            'month_revenue': float(month_revenue),
            'avg_check': float(avg_check),
            'chart_data': chart_data
        }

        serializer = RevenueStatsSerializer(data)
        return Response(serializer.data)


class OccupancyChartView(APIView):
    """Получение данных о загрузке для графика"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        today = timezone.now().date()
        chart_data = []

        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            day_start = datetime.combine(date, datetime.min.time())
            day_end = datetime.combine(date, datetime.max.time())

            # Бронирования за этот день
            day_bookings = Booking.objects.filter(
                start_time__date=date,
                status='confirmed'
            ).count()

            # Всего мест
            total_places = Place.objects.filter(is_active=True).count()

            occupancy = (day_bookings / total_places * 100) if total_places > 0 else 0

            chart_data.append({
                'date': date.strftime('%d.%m'),
                'occupancy': round(occupancy, 1),
                'bookings': day_bookings
            })

        return Response({'chart_data': chart_data})
