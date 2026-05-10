from django.contrib import admin
from django import forms
from .models import Space, Place, PlacePhoto


# Inline для фотографий
class PlacePhotoInline(admin.TabularInline):
    model = PlacePhoto
    extra = 3
    fields = ('image', 'order')


class PlaceAdminForm(forms.ModelForm):
    class Meta:
        model = Place
        fields = '__all__'
        widgets = {
            'gallery_images': forms.Textarea(attrs={'rows': 3, 'class': 'vLargeTextField'}),
        }


class PlaceInline(admin.TabularInline):
    model = Place
    extra = 1
    fields = ('name', 'place_type', 'capacity', 'x', 'y', 'is_active', 'base_tariff')


@admin.register(Space)
class SpaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'total_places', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'address')
    inlines = [PlaceInline]
    fieldsets = (
        (None, {'fields': ('name', 'description', 'address', 'image', 'map_image')}),  # ← добавили map_image
        ('Статус', {'fields': ('is_active',)}),
    )

@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    form = PlaceAdminForm
    change_form_template = 'admin/spaces/place/change_form.html'   # ← это новая строка
    list_display = ('name', 'space', 'place_type', 'capacity', 'is_active', 'created_at')
    list_filter = ('place_type', 'is_active', 'space')
    search_fields = ('name', 'space__name')
    inlines = [PlacePhotoInline]
    fieldsets = (
        (None, {'fields': ('space', 'name', 'place_type', 'capacity')}),
        ('Расположение', {'fields': ('x', 'y')}),
        ('Фотографии', {'fields': ('preview_image', 'gallery_images')}),
        ('Характеристики', {'fields': ('characteristics', 'base_tariff')}),
        ('Статус', {'fields': ('is_active',)}),
    )