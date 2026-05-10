from rest_framework import serializers
from tariffs.serializers import TariffSerializer
from utils.serializer_mixins import OptimisticLockingMixin   
from .models import Space, Place, PlacePhoto, PlaceReview
from django.core.files.storage import default_storage

class PlacePhotoSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PlacePhoto
        fields = ('id', 'image', 'image_url', 'order')
        read_only_fields = ('id',)

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class PlaceSerializer(OptimisticLockingMixin, serializers.ModelSerializer):  
    space_name = serializers.CharField(source='space.name', read_only=True)
    base_tariff_info = TariffSerializer(source='base_tariff', read_only=True)
    preview_image = serializers.ImageField(required=False, allow_null=True)
    gallery_images = serializers.ListField(required=False, default=list)
    photos = PlacePhotoSerializer(many=True, read_only=True)
    version = serializers.IntegerField(required=False)

    # === НОВОЕ ПОЛЕ ДЛЯ ЗАГРУЗКИ ФАЙЛОВ ГАЛЕРЕИ ===
    gallery_uploads = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Place
        fields = (
            'id', 'space', 'space_name', 'place_type', 'name', 'capacity',
            'x', 'y', 'characteristics', 'is_active', 'base_tariff',
            'base_tariff_info', 'created_at', 'updated_at',
            'preview_image', 'gallery_images', 'photos',
            'version', 'gallery_uploads',       # ← добавлено
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        gallery_files = validated_data.pop('gallery_uploads', [])
        place = super().create(validated_data)
        self._save_gallery_files(place, gallery_files)
        return place

    def update(self, instance, validated_data):
        gallery_files = validated_data.pop('gallery_uploads', [])
        place = super().update(instance, validated_data)
        self._save_gallery_files(place, gallery_files)
        return place

    def _save_gallery_files(self, place, files):
        """Сохраняет файлы в медиа и добавляет их URL в gallery_images."""
        urls = list(place.gallery_images) if place.gallery_images else []
        for file in files:
            saved_path = default_storage.save(f'places/gallery/{file.name}', file)
            url = default_storage.url(saved_path)
            urls.append(url)
        place.gallery_images = urls
        place.save(update_fields=['gallery_images'])

    def validate_capacity(self, value):
        if self.instance and self.instance.place_type == 'desk' and value != 1:
            return 1
        return value


class SpaceSerializer(OptimisticLockingMixin, serializers.ModelSerializer):   
    total_places = serializers.IntegerField(read_only=True)
    map_image = serializers.ImageField(required=False, allow_null=True)
    map_image_url = serializers.SerializerMethodField(read_only=True)
    version = serializers.IntegerField(required=False)  

    class Meta:
        model = Space
        fields = (
            'id', 'name', 'description', 'address', 'total_places',
            'image', 'map_image', 'map_image_url', 'is_active', 'created_at', 'updated_at',
            'version',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'total_places')

    def get_map_image_url(self, obj):
        if obj.map_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.map_image.url)
            return obj.map_image.url
        return None


class SpaceDetailSerializer(SpaceSerializer):
    places = serializers.SerializerMethodField()

    class Meta(SpaceSerializer.Meta):
        fields = SpaceSerializer.Meta.fields + ('places',)

    def get_places(self, obj):
        return PlaceSerializer(
            obj.places.filter(is_active=True),
            many=True,
            context=self.context
        ).data


class PlaceReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    created_at = serializers.DateTimeField(format='%d.%m.%Y %H:%M', read_only=True)

    class Meta:
        model = PlaceReview
        fields = ('id', 'user', 'user_email', 'user_name', 'text', 'rating', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')