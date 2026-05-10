from rest_framework import serializers
from rest_framework.exceptions import APIException
from rest_framework import status

class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Запись была изменена другим пользователем. Обновите страницу и попробуйте снова.'
    default_code = 'version_conflict'

class OptimisticLockingMixin:
    """
    Миксин для сериализатора, который добавляет оптимистичную блокировку
    через поле 'version'.
    При обновлении проверяет, что переданная версия совпадает с текущей в объекте.
    Если не совпадает, выбрасывает ConflictError (409).
    """
    def update(self, instance, validated_data):
        request_version = validated_data.pop('version', None)
        if request_version is not None and request_version != instance.version:
            raise ConflictError(
                detail='Запись была изменена. Обновите данные и повторите попытку.'
            )
        # Увеличиваем версию
        instance.version += 1
        # Вызываем стандартный update
        return super().update(instance, validated_data)