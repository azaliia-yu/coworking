from celery import shared_task
from django.utils import timezone
from .models import Report
from .services import (
    generate_occupancy_report, generate_revenue_report,
    generate_clients_report, generate_bookings_report,
    export_report_to_csv
)
import json
import logging

logger = logging.getLogger(__name__)


@shared_task
def generate_report_task(report_id):
    """
    Асинхронная генерация отчета
    """
    try:
        report = Report.objects.get(id=report_id)
        report.status = 'processing'
        report.save()

        params = report.parameters
        start_date = params.get('start_date')
        end_date = params.get('end_date')
        space_id = params.get('space_id')
        place_id = params.get('place_id')

        # Преобразуем строки в даты
        from datetime import datetime
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        # Генерируем отчет в зависимости от типа
        if report.type == 'occupancy':
            report_data = generate_occupancy_report(start_date, end_date, space_id)
        elif report.type == 'revenue':
            report_data = generate_revenue_report(start_date, end_date, space_id)
        elif report.type == 'clients':
            report_data = generate_clients_report(start_date, end_date, space_id)
        elif report.type == 'bookings':
            report_data = generate_bookings_report(start_date, end_date, space_id, place_id)
        else:
            raise ValueError(f"Unknown report type: {report.type}")

        # Сохраняем данные отчета в поле parameters
        report.parameters = {
            **params,
            'result': report_data
        }

        # Экспорт в CSV если нужно
        if report.format == 'csv':
            csv_content = export_report_to_csv(report_data, report.type)
            from django.core.files.base import ContentFile
            filename = f"{report.type}_{start_date}_{end_date}.csv"
            report.file.save(filename, ContentFile(csv_content), save=False)

        report.status = 'completed'
        report.completed_at = timezone.now()
        report.save()

        logger.info(f"Report {report_id} generated successfully")

    except Exception as e:
        logger.error(f"Failed to generate report {report_id}: {e}")
        try:
            report = Report.objects.get(id=report_id)
            report.status = 'failed'
            report.error_message = str(e)
            report.save()
        except Report.DoesNotExist:
            pass
