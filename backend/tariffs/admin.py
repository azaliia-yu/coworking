from django.contrib import admin
from .models import Tariff, PlaceTariff

@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'price', 'package_hours', 'is_active', 'created_at')
    list_filter = ('type', 'is_active')
    search_fields = ('name', 'description')
    fieldsets = (
        (None, {'fields': ('name', 'type', 'price', 'package_hours', 'description')}),
        ('Статус', {'fields': ('is_active',)}),
    )

@admin.register(PlaceTariff)
class PlaceTariffAdmin(admin.ModelAdmin):
    list_display = ('place', 'tariff', 'custom_price')
    list_filter = ('tariff__type', 'tariff__is_active')
    search_fields = ('place__name', 'tariff__name')
    raw_id_fields = ('place', 'tariff')
