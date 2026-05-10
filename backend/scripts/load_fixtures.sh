#!/bin/bash

# Скрипт для загрузки начальных данных в базу данных
# Использование: bash scripts/load_fixtures.sh

echo "============================================================"
echo "  Загрузка начальных данных системы коворкинга"
echo "============================================================"
echo ""

# Проверка наличия Python
if ! command -v python &> /dev/null; then
    echo "ОШИБКА: Python не найден. Установите Python и повторите попытку."
    exit 1
fi

# Проверка наличия файлов фикстур
if [ ! -f "settings/fixtures/initial_settings.json" ]; then
    echo "ОШИБКА: Файл settings/fixtures/initial_settings.json не найден."
    exit 1
fi

if [ ! -f "spaces/fixtures/places_with_photos.json" ]; then
    echo "ПРЕДУПРЕЖДЕНИЕ: Файл spaces/fixtures/places_with_photos.json не найден."
    echo "Будут загружены только настройки системы."
    echo ""
fi

# Загрузка настроек бронирования и рабочих часов
echo "[1/2] Загрузка настроек системы..."
python manage.py loaddata settings/fixtures/initial_settings.json

if [ $? -eq 0 ]; then
    echo "      Настройки системы успешно загружены."
else
    echo "      ОШИБКА при загрузке настроек системы."
    echo "      Возможно, данные уже существуют в базе."
    echo "      Используйте: python manage.py init_settings --reset"
    echo ""
    exit 1
fi

# Загрузка тестовых данных (мест с фото)
if [ -f "spaces/fixtures/places_with_photos.json" ]; then
    echo "[2/2] Загрузка тестовых данных мест..."
    python manage.py loaddata spaces/fixtures/places_with_photos.json

    if [ $? -eq 0 ]; then
        echo "      Тестовые данные успешно загружены."
    else
        echo "      ПРЕДУПРЕЖДЕНИЕ: Тестовые данные не загружены."
        echo "      Возможно, данные уже существуют или требуется миграция."
        echo ""
    fi
else
    echo "[2/2] Пропущено (файл с тестовыми данными не найден)"
fi

echo ""
echo "============================================================"
echo "  Загрузка данных завершена."
echo "============================================================"
echo ""
echo "Для проверки выполните:"
echo "  python manage.py init_settings"
echo ""
echo "Для сброса настроек к значениям по умолчанию:"
echo "  python manage.py init_settings --reset"
echo ""