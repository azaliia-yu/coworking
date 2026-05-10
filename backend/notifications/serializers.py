from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'user', 'type', 'type_display', 'subject', 'content',
                  'status', 'status_display', 'created_at', 'sent_at', 'is_read',
                  'error_message')
        read_only_fields = ('id', 'user', 'status', 'created_at', 'sent_at',
                            'error_message')


class CreateNotificationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    type = serializers.ChoiceField(choices=Notification.TYPE_CHOICES)
    subject = serializers.CharField(required=False, allow_blank=True)
    content = serializers.CharField()
