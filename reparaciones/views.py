from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal
from .models import Cliente, Repuesto, OrdenServicio, DetalleInventario
from .serializers import ClienteSerializer, RepuestoSerializer, OrdenServicioSerializer, DetalleInventarioSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

class RepuestoViewSet(viewsets.ModelViewSet):
    queryset = Repuesto.objects.all()
    serializer_class = RepuestoSerializer

class OrdenServicioViewSet(viewsets.ModelViewSet):
    queryset = OrdenServicio.objects.all().order_by('-fecha_ingreso')
    serializer_class = OrdenServicioSerializer

    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        orden = self.get_object()
        nuevo_estado = request.data.get('estado')
        observaciones = request.data.get('observaciones', None)
        estados_validos = ['RECIBIDO', 'DIAGNOSTICO', 'REPARACION', 'LISTO']

        if nuevo_estado not in estados_validos:
            return Response({'error': 'Estado no valido'}, status=status.HTTP_400_BAD_REQUEST)

        if observaciones is not None:
            orden.notas = observaciones

        if nuevo_estado == 'LISTO' and orden.estado != 'LISTO':
            for detalle in orden.detalles.all():
                pieza = detalle.repuesto
                if pieza.stock_disponible < detalle.cantidad_usada:
                    return Response(
                        {'error': f'Stock insuficiente de "{pieza.nombre_pieza}". Disponible: {pieza.stock_disponible}, requerido: {detalle.cantidad_usada}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            total_piezas = Decimal('0')
            for detalle in orden.detalles.all():
                pieza = detalle.repuesto
                pieza.stock_disponible -= detalle.cantidad_usada
                pieza.save()
                total_piezas += Decimal(str(pieza.precio_unitario)) * Decimal(str(detalle.cantidad_usada))

            orden.total_pagar = Decimal(str(orden.costo_mano_obra)) + total_piezas
            orden.fecha_fin = timezone.now()

        orden.estado = nuevo_estado
        orden.save()
        return Response(OrdenServicioSerializer(orden).data)

    @action(detail=True, methods=['post'])
    def pagar(self, request, pk=None):
        orden = self.get_object()
        orden.pagado = True
        orden.metodo_pago = request.data.get('metodo_pago', 'EFECTIVO')
        orden.fecha_pago = timezone.now()   # <- guarda la fecha de pago
        orden.save()
        return Response({'ok': True})


class DetalleInventarioViewSet(viewsets.ModelViewSet):
    queryset = DetalleInventario.objects.all()
    serializer_class = DetalleInventarioSerializer


@api_view(['GET'])
def dashboard(request):
    hoy = timezone.now()

    activas = OrdenServicio.objects.filter(pagado=False).exclude(estado='LISTO').count()

    terminadas = OrdenServicio.objects.filter(estado='LISTO', pagado=False).count()

    ingresos = OrdenServicio.objects.filter(
        pagado=True,
        fecha_pago__year=hoy.year,
        fecha_pago__month=hoy.month
    ).aggregate(total=Sum('total_pagar'))['total'] or 0

    piezas = (
        DetalleInventario.objects
        .values('repuesto__nombre_pieza')
        .annotate(total_usado=Sum('cantidad_usada'))
        .order_by('-total_usado')[:5]
    )

    return Response({
        'activas': activas,
        'terminadas': terminadas,
        'ingresos_mes': float(ingresos),
        'piezas_mas_usadas': list(piezas),
    })