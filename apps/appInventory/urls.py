from django.urls import path
from .views import (
    ProductoLista,
    ProductoCreate,
    ProductoDelete,
    ProductoUpdate,
)

app_name = 'inventario'

urlpatterns = [
    path('', ProductoLista.as_view(), name='lista_productos'),
    path('productos_lista/', ProductoLista.as_view(), name='productos_lista'),
    path('productos/crear/', ProductoCreate.as_view(), name='producto_crear'),
    path('productos/editar/<int:pk>/', ProductoUpdate.as_view(), name='producto_editar'),
    path('productos/eliminar/<int:pk>/', ProductoDelete.as_view(), name='producto_eliminar'),
]
