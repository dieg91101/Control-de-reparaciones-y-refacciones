from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ClienteViewSet, RepuestoViewSet, OrdenServicioViewSet, DetalleInventarioViewSet, dashboard

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'repuestos', RepuestoViewSet)
router.register(r'ordenes', OrdenServicioViewSet)
router.register(r'detalles', DetalleInventarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard)
]