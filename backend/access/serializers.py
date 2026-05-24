from rest_framework import serializers
from .models import AccessCard, AccessLog


class AccessCardSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = AccessCard
        fields = ('id', 'user', 'user_email', 'user_name', 'card_number', 'pin_code',
                  'is_active', 'issued_at', 'expires_at', 'last_used_at')
        extra_kwargs = {
            'card_number': {'required': False}   
        }


class AccessLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    event_display = serializers.CharField(source='get_event_display', read_only=True)

    class Meta:
        model = AccessLog
        fields = ('id', 'user', 'user_email', 'card', 'event', 'event_display',
                  'timestamp', 'door', 'reason')