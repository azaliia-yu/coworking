from django.apps import AppConfig
import os

class SettingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'settings'
    verbose_name = 'Настройки'

    def ready(self):
        """
        Автоматическая инициализация настроек при запуске приложения.
        Создает базовые настройки бронирования и рабочие часы,
        если они еще не существуют в базе данных.
        """
        # Защита от двойного выполнения при авто-перезагрузке
        if os.environ.get('RUN_MAIN') == 'true':
            return

        try:
            from django.db import connection
            
            # Проверяем, что таблицы существуют (после миграции)
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'settings_bookingsettings'
                    )
                """)
                table_exists = cursor.fetchone()[0]
            
            if not table_exists:
                print("Таблицы настроек еще не созданы. Пропускаем инициализацию.")
                return

            from .models import BookingSettings, WorkingHours
            
            # Инициализация настроек бронирования
            if not BookingSettings.objects.exists():
                print("=" * 60)
                print(" Инициализация настроек системы коворкинга...")
                print("=" * 60)
                
                BookingSettings.objects.create(
                    min_booking_duration=30,
                    max_booking_duration=1440,
                    booking_interval=15,
                    advance_booking_days=30,
                    cancellation_deadline_minutes=120,
                    allow_simultaneous_bookings=False,
                    max_simultaneous_bookings=1,
                    auto_cancel_unpaid_minutes=30,
                    enable_notifications=True,
                    reminder_minutes_before=60
                )
                print(" Настройки бронирования созданы")
                
                # Инициализация рабочих часов
                working_hours = [
                    (0, 'Понедельник', '09:00:00', '22:00:00', True),
                    (1, 'Вторник', '09:00:00', '22:00:00', True),
                    (2, 'Среда', '09:00:00', '22:00:00', True),
                    (3, 'Четверг', '09:00:00', '22:00:00', True),
                    (4, 'Пятница', '09:00:00', '22:00:00', True),
                    (5, 'Суббота', '10:00:00', '20:00:00', True),
                    (6, 'Воскресенье', '10:00:00', '18:00:00', True),
                ]
                
                for day, name, start, end, is_working in working_hours:
                    WorkingHours.objects.create(
                        day=day,
                        start_time=start,
                        end_time=end,
                        is_working=is_working
                    )
                    print(f" {name}: {start[:5]}-{end[:5]}")
                
                print("=" * 60)
                print("Все настройки успешно инициализированы!")
                print("=" * 60)
            else:
                print("Настройки уже существуют в базе данных")
                
        except Exception as e:
            # При первой миграции таблиц может не быть
            print(f"Инициализация настроек отложена: {e}")
