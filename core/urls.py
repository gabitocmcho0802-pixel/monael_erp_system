from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from django.views.generic import RedirectView

# Patrones para usuarios (login / logout) para compatibilidad con base.html
usuarios_patterns = ([
    path('login/', auth_views.LoginView.as_view(), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
], 'usuarios')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('usuarios/', include(usuarios_patterns, namespace='usuarios')),
    path('inventario/', include('apps.appInventory.urls')),
    path('', RedirectView.as_view(url='/inventario/', permanent=False)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
