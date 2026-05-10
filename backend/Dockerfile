# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Устанавливаем системные зависимости для psycopg2 и Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev libjpeg-dev zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Порт по умолчанию
EXPOSE 8000

# Запуск Gunicorn для демонстрации (можно заменить на runserver для отладки)
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]