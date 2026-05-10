from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    format_display = serializers.CharField(source='get_format_display', read_only=True)
    admin_name = serializers.CharField(source='admin.get_full_name', read_only=True)
    admin_email = serializers.CharField(source='admin.email', read_only=True)

    class Meta:
        model = Report
        fields = ('id', 'admin', 'admin_name', 'admin_email', 'type', 'type_display',
                  'format', 'format_display', 'parameters', 'file', 'status',
                  'error_message', 'created_at', 'completed_at')
        read_only_fields = ('id', 'admin', 'status', 'error_message', 'created_at',
                            'completed_at')


class CreateReportSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=Report.TYPE_CHOICES)
    format = serializers.ChoiceField(choices=Report.FORMAT_CHOICES, default='json')
    start_date = serializers.DateField(required=True)
    end_date = serializers.DateField(required=True)
    space_id = serializers.IntegerField(required=False, allow_null=True)
    place_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError('Дата начала не может быть позже даты окончания')
        return data
