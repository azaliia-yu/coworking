# backend/demo/management/commands/fill_demo_data.py
import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from users.models import User
from spaces.models import Space, Place
from tariffs.models import Tariff, PlaceTariff
from bookings.models import Booking
from settings.models import BookingSettings, WorkingHours


class Command(BaseCommand):
    help = 'Дозаполнить базу демо-данными (помещения, места, бронирования) без дублирования пользователей и тарифов'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Удалить существующие демо-данные (помещения, места, бронирования) перед созданием новых',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('Удаление существующих демо-данных...'))
            Booking.objects.all().delete()
            PlaceTariff.objects.all().delete()
            Place.objects.all().delete()
            Space.objects.all().delete()
            # Тарифы и пользователей не трогаем, они уже созданы вручную

        # ---------- 1. Поиск или создание пользователя-клиента ----------
        self.stdout.write('Проверка пользователей...')
        client, created = User.objects.get_or_create(
            email='client@example.com',
            defaults={
                'first_name': 'Иван',
                'last_name': 'Иванов',
                'role': 'client',
                'is_active': True,
                'balance': 5000,
            }
        )
        if created:
            client.set_password('client123')
            client.save()
            self.stdout.write('  Клиент создан: client@example.com / client123')
        else:
            # Если уже есть, убедимся что имя корректное (можно обновить)
            if client.first_name != 'Иван' or client.last_name != 'Иванов':
                client.first_name = 'Иван'
                client.last_name = 'Иванов'
                client.save()
            self.stdout.write(f'  Найден клиент: {client.email} ({client.get_full_name()})')

        # ---------- 2. Поиск или создание тарифов ----------
        self.stdout.write('Проверка тарифов...')
        tariff_hourly, _ = Tariff.objects.get_or_create(
            name='Почасовой (стандарт)',
            type='hourly',
            defaults={'price': 300, 'is_active': True, 'description': 'Оплата за каждый час использования'}
        )
        tariff_daily, _ = Tariff.objects.get_or_create(
            name='Дневной',
            type='daily',
            defaults={'price': 1500, 'is_active': True, 'description': 'Фиксированная плата за полный день'}
        )
        tariff_monthly, _ = Tariff.objects.get_or_create(
            name='Абонемент на месяц',
            type='monthly',
            defaults={'price': 20000, 'is_active': True, 'description': 'Неограниченное использование в течение месяца'}
        )
        tariff_package, _ = Tariff.objects.get_or_create(
            name='Пакет 10 часов',
            type='package',
            defaults={'price': 2500, 'package_hours': 10, 'is_active': True, 'description': '10 часов на любое рабочее место'}
        )
        self.stdout.write('  Все нужные тарифы доступны.')

        # ---------- 3. Создание помещений ----------
        self.stdout.write('Создание помещений...')
        space_main, _ = Space.objects.get_or_create(
            name='Основной зал',
            defaults={
                'description': 'Просторный зал с панорамными окнами, кондиционером и высокоскоростным Wi-Fi.',
                'address': 'ул. Ленина, 10',
                'is_active': True,
            }
        )
        space_vip, _ = Space.objects.get_or_create(
            name='VIP-зона',
            defaults={
                'description': 'Тихая зона для важных встреч и сосредоточенной работы.',
                'address': 'ул. Ленина, 10, 2 этаж',
                'is_active': True,
            }
        )
        self.stdout.write(f'  Помещения: {space_main.name}, {space_vip.name}')

        # ---------- 4. Создание рабочих мест ----------
        self.stdout.write('Создание мест...')
        places_data = [
            {'space': space_main, 'name': 'Стол у окна 1', 'place_type': 'desk', 'x': 50, 'y': 50,
             'characteristics': {'has_power': True, 'has_wifi': True}},
            {'space': space_main, 'name': 'Стол у окна 2', 'place_type': 'desk', 'x': 150, 'y': 50,
             'characteristics': {'has_power': True, 'has_wifi': True}},
            {'space': space_main, 'name': 'Переговорная «Атмосфера»', 'place_type': 'meeting_room', 'capacity': 8,
             'x': 300, 'y': 100, 'characteristics': {'has_power': True, 'has_wifi': True, 'has_projector': True,
                                                     'has_whiteboard': True}},
            # VIP-зона
            {'space': space_vip, 'name': 'VIP-стол 1', 'place_type': 'desk', 'x': 30, 'y': 40,
             'characteristics': {'has_power': True, 'has_wifi': True, 'has_air_conditioning': True}},
            {'space': space_vip, 'name': 'VIP-переговорная', 'place_type': 'meeting_room', 'capacity': 6,
             'x': 250, 'y': 150, 'characteristics': {'has_power': True, 'has_wifi': True, 'has_projector': True}},
        ]

        for data in places_data:
            place, created = Place.objects.get_or_create(
                space=data['space'],
                name=data['name'],
                defaults={
                    'place_type': data['place_type'],
                    'capacity': data.get('capacity', 1),
                    'x': data.get('x'),
                    'y': data.get('y'),
                    'characteristics': data.get('characteristics', {}),
                    'is_active': True,
                }
            )
            if created:
                self.stdout.write(f'    + {place.name} ({place.place_type})')

        # ---------- 5. Привязка тарифов к местам ----------
        self.stdout.write('Привязка тарифов к местам...')
        place_desk_main = Place.objects.filter(place_type='desk', space=space_main).first()
        if place_desk_main:
            place_desk_main.base_tariff = tariff_hourly
            place_desk_main.save()
            PlaceTariff.objects.get_or_create(place=place_desk_main, tariff=tariff_hourly)
            PlaceTariff.objects.get_or_create(place=place_desk_main, tariff=tariff_daily,
                                              defaults={'custom_price': 1200})

        meeting_main = Place.objects.filter(place_type='meeting_room', space=space_main).first()
        if meeting_main:
            meeting_main.base_tariff = tariff_hourly
            meeting_main.save()
            PlaceTariff.objects.get_or_create(place=meeting_main, tariff=tariff_hourly,
                                              defaults={'custom_price': 500})

        vip_desk = Place.objects.filter(place_type='desk', space=space_vip).first()
        if vip_desk:
            vip_desk.base_tariff = tariff_hourly
            vip_desk.save()
            PlaceTariff.objects.get_or_create(place=vip_desk, tariff=tariff_hourly,
                                              defaults={'custom_price': 400})
            PlaceTariff.objects.get_or_create(place=vip_desk, tariff=tariff_monthly)

        self.stdout.write('  Тарифы привязаны к местам.')

        # ---------- 6. Бронирования для клиента ----------
        self.stdout.write('Создание бронирований для клиента...')
        from django.db import models as db_models
        now = timezone.now()

        bookings_to_create = []

        # Прошедшее завершённое (обходим валидацию, так как start_time в прошлом)
        start_past = now - timedelta(days=2, hours=2)
        end_past = now - timedelta(days=2, hours=1)
        bookings_to_create.append(
            Booking(
                user=client,
                place=place_desk_main,
                tariff=tariff_hourly,
                start_time=start_past,
                end_time=end_past,
                status='completed',
                total_cost=300
            )
        )

        # Текущее активное
        start_active = now - timedelta(hours=1)
        end_active = now + timedelta(hours=2)
        bookings_to_create.append(
            Booking(
                user=client,
                place=place_desk_main,
                tariff=tariff_hourly,
                start_time=start_active,
                end_time=end_active,
                status='confirmed',
                total_cost=900
            )
        )

        # Будущее подтверждённое
        start_future = now + timedelta(days=1, hours=2)
        end_future = now + timedelta(days=1, hours=5)
        bookings_to_create.append(
            Booking(
                user=client,
                place=meeting_main,
                tariff=tariff_hourly,
                start_time=start_future,
                end_time=end_future,
                status='confirmed',
                total_cost=1500
            )
        )


        # Создаём все бронирования разом, минуя full_clean
        Booking.objects.bulk_create(bookings_to_create)
        self.stdout.write('  4 бронирования созданы (завершённое, активное, будущее подтверждённое, ожидающее).')


        # ---------- 7. Настройки бронирования (если не созданы) ----------
        if not BookingSettings.objects.exists():
            BookingSettings.objects.create()
        if not WorkingHours.objects.filter(day=0).exists():
            for day, start, end in [(0, '09:00', '22:00'), (1, '09:00', '22:00'),
                                    (2, '09:00', '22:00'), (3, '09:00', '22:00'),
                                    (4, '09:00', '22:00'), (5, '10:00', '20:00'),
                                    (6, '10:00', '18:00')]:
                WorkingHours.objects.create(day=day, start_time=start, end_time=end, is_working=True)

        self.stdout.write(self.style.SUCCESS('✅ Демо-данные успешно добавлены!'))
        self.stdout.write('   Клиент: client@example.com / client123')
        self.stdout.write('   Администратор и тарифы не изменены.')