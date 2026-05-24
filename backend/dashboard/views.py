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
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')

        if start_str and end_str:
            try:
                start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Неверный формат даты'}, status=400)
        else:
            today = timezone.now().date()
            start_date = today - timedelta(days=7)
            end_date = today

        # Выручка за выбранный период
        period_bookings = Booking.objects.filter(
            start_time__date__gte=start_date,
            start_time__date__lte=end_date,
            status__in=['confirmed', 'completed']
        )
        period_revenue = period_bookings.aggregate(total=Sum('total_cost'))['total'] or 0
        bookings_count = period_bookings.count()
        avg_check = period_revenue / bookings_count if bookings_count > 0 else 0

        # Данные для графика – каждый день в диапазоне
        chart_data = []
        current_date = start_date
        while current_date <= end_date:
            day_revenue = Booking.objects.filter(
                start_time__date=current_date,
                status__in=['confirmed', 'completed']
            ).aggregate(total=Sum('total_cost'))['total'] or 0
            chart_data.append({
                'date': current_date.strftime('%d.%m'),
                'revenue': float(day_revenue)
            })
            current_date += timedelta(days=1)

        # Дополнительно: сегодня/неделя/месяц можно убрать или пересчитать
        data = {
            'today_revenue': 0,   # можно оставить как 0, если не нужно
            'week_revenue': float(period_revenue),   # показываем за выбранный период
            'month_revenue': float(period_revenue),
            'avg_check': float(avg_check),
            'chart_data': chart_data
        }

        serializer = RevenueStatsSerializer(data)
        return Response(serializer.data)

class OccupancyChartView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')

        if start_str and end_str:
            try:
                start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Неверный формат даты'}, status=400)
        else:
            today = timezone.now().date()
            start_date = today - timedelta(days=7)
            end_date = today

        total_places = Place.objects.filter(is_active=True).count()
        chart_data = []

        current_date = start_date
        while current_date <= end_date:
            day_bookings = Booking.objects.filter(
                start_time__date=current_date,
                status__in=['confirmed', 'completed']
            ).count()

            occupancy = (day_bookings / total_places * 100) if total_places > 0 else 0

            chart_data.append({
                'date': current_date.strftime('%d.%m'),
                'occupancy': round(occupancy, 1),
                'bookings': day_bookings
            })
            current_date += timedelta(days=1)

        return Response({'chart_data': chart_data})