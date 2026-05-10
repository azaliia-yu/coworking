from rest_framework import serializers
from .models import BookingSettings, WorkingHours
from utils.serializer_mixins import OptimisticLockingMixin  


class BookingSettingsSerializer(OptimisticLockingMixin, serializers.ModelSerializer):  
    version = serializers.IntegerField(required=False)        

    class Meta:
        model = BookingSettings
        fields = '__all__'


class WorkingHoursSerializer(OptimisticLockingMixin, serializers.ModelSerializer):  
    day_display = serializers.CharField(source='get_day_display', read_only=True)
    version = serializers.IntegerField(required=False)        

    class Meta:
        model = WorkingHours
        fields = ('id', 'day', 'day_display', 'start_time', 'end_time', 'is_working',
                  'version',)                                  
