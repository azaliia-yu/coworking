from rest_framework import serializers
from .models import Tariff, PlaceTariff
from utils.serializer_mixins import OptimisticLockingMixin   


class TariffSerializer(OptimisticLockingMixin, serializers.ModelSerializer):  
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    package_hours = serializers.IntegerField(allow_null=True, required=False)
    version = serializers.IntegerField(required=False)        

    class Meta:
        model = Tariff
        fields = ('id', 'name', 'type', 'type_display', 'price', 'package_hours',
                  'is_active', 'description', 'created_at', 'updated_at',
                  'version',)                                  
        read_only_fields = ('id', 'created_at', 'updated_at')


class PlaceTariffSerializer(OptimisticLockingMixin, serializers.ModelSerializer):  
    tariff_name = serializers.CharField(source='tariff.name', read_only=True)
    tariff_type = serializers.CharField(source='tariff.type', read_only=True)
    tariff_info = TariffSerializer(source='tariff', read_only=True)
    final_price = serializers.SerializerMethodField()
    version = serializers.IntegerField(required=False)        

    class Meta:
        model = PlaceTariff
        fields = ('id', 'place', 'tariff', 'tariff_name', 'tariff_type',
                  'tariff_info', 'custom_price', 'final_price',
                  'version',)                                  

    def get_final_price(self, obj):
        return obj.get_price()