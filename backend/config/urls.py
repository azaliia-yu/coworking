from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Coworking API",
        default_version='v1',
        description="API for coworking management system",
        contact=openapi.Contact(email="support@coworking.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('users.urls')),
    path('api/v1/', include('spaces.urls')),
    path('api/v1/', include('tariffs.urls')),
    path('api/v1/', include('bookings.urls')),
    path('api/v1/', include('payments.urls')),
    path('api/v1/', include('notifications.urls')),
    path('api/v1/', include('reports.urls')),
    path('api/v1/', include('settings.urls')),  # Добавляем настройки
    path('api/v1/', include('access.urls')),  # Добавляем доступ (СКУД)
    path('api/v1/', include('dashboard.urls')),  # Добавляем дашборд

    # Swagger
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
