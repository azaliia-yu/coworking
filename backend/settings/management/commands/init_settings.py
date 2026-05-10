from django.core.management.base import BaseCommand
from django.db import transaction
from settings.models import BookingSettings, WorkingHours


class Command(BaseCommand):
    help = 'Сброс и инициализация настроек системы коворкинга'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Сбросить существующие настройки перед созданием новых',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('Сброс существующих настроек...'))
            BookingSettings.objects.all().delete()
            WorkingHours.objects.all().delete()

        self.stdout.write('=' * 60)
        self.stdout.write('Инициализация настроек системы коворкинга')
        self.stdout.write('=' * 60)

        # Настройки бронирования
        settings, created = BookingSettings.objects.get_or_create(
            pk=1,
            defaults={
                'min_booking_duration': 30,
                'max_booking_duration': 1440,
                'booking_interval': 15,
                'advance_booking_days': 30,
                'cancellation_deadline_minutes': 120,
                'allow_simultaneous_bookings': False,
                'max_simultaneous_bookings': 1,
                'auto_cancel_unpaid_minutes': 30,
                'enable_notifications': True,
                'reminder_minutes_before': 60,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('Настройки бронирования созданы'))
        else:
            self.stdout.write(self.style.WARNING('Настройки бронирования уже существуют'))

        # Рабочие часы
        self.stdout.write('\nРабочие часы:')
        working_hours = [
            (0, 'Понедельник', '09:00', '22:00'),
            (1, 'Вторник', '09:00', '22:00'),
            (2, 'Среда', '09:00', '22:00'),
            (3, 'Четверг', '09:00', '22:00'),
            (4, 'Пятница', '09:00', '22:00'),
            (5, 'Суббота', '10:00', '20:00'),
            (6, 'Воскресенье', '10:00', '18:00'),
        ]

        for day, name, start, end in working_hours:
            wh, created = WorkingHours.objects.update_or_create(
                day=day,
                defaults={
                    'start_time': start,
                    'end_time': end,
                    'is_working': True,
                }
            )
            status = self.style.SUCCESS('создано') if created else 'обновлено'
            self.stdout.write(f'  [{status}] {name}: {start}-{end}')

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('Инициализация завершена!'))
        self.stdout.write('=' * 60)
