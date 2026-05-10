from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Report
from .serializers import ReportSerializer, CreateReportSerializer
from .tasks import generate_report_task
from users.permissions import IsAdmin
from datetime import datetime


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'status']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Report.objects.none()
        return Report.objects.filter(admin=self.request.user)
        
    def perform_create(self, serializer):
        report = serializer.save(admin=self.request.user, status='pending')
        generate_report_task(report.id)
        return report

    @action(detail=False, methods=['post'])
    def create_report(self, request):
        """Создание нового отчета"""
        serializer = CreateReportSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data

            # Преобразуем даты в строки для JSON
            report_data = {
                'type': data['type'],
                'format': data['format'],
                'start_date': data['start_date'].isoformat(),
                'end_date': data['end_date'].isoformat(),
                'space_id': data.get('space_id'),
                'place_id': data.get('place_id')
            }

            report = Report.objects.create(
                admin=request.user,
                type=data['type'],
                format=data['format'],
                parameters=report_data,
                status='pending'
            )

            generate_report_task.delay(report.id)

            return Response({
                'id': report.id,
                'message': 'Отчет создан и поставлен в очередь на генерацию'
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Скачать готовый отчет"""
        report = self.get_object()

        if report.status != 'completed':
            return Response({'error': 'Отчет еще не готов'},
                            status=status.HTTP_400_BAD_REQUEST)

        if report.file:
            from django.http import FileResponse
            response = FileResponse(report.file, as_attachment=True)
            response['Content-Disposition'] = f'attachment; filename="report_{report.id}.{report.format}"'
            return response

        # Если файла нет, возвращаем JSON
        return Response(report.parameters.get('result', {}))

    @action(detail=False, methods=['get'])
    def types(self, request):
        """Получить список доступных типов отчетов"""
        return Response({
            'types': [
                {'value': 'occupancy', 'label': 'Загрузка помещений'},
                {'value': 'revenue', 'label': 'Доходы'},
                {'value': 'clients', 'label': 'Клиенты'},
                {'value': 'bookings', 'label': 'Бронирования'}
            ],
            'formats': [
                {'value': 'json', 'label': 'JSON'},
                {'value': 'csv', 'label': 'CSV'}
            ]
        })
