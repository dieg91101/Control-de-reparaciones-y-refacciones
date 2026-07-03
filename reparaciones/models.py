from django.db import models
from django.utils import timezone

class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(max_length=255, unique=True)

    class Meta:
        db_table = 'clientes'
    
    def __str__(self):
        return self.nombre

class Repuesto(models.Model):
    nombre_pieza = models.CharField(max_length=100)
    stock_disponible = models.IntegerField(default=0)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

class OrdenServicio(models.Model):
    ESTADOS = [
        ('RECIBIDO', 'Recibido'),
        ('DIAGNOSTICO', 'Diagnostico'),
        ('REPARACION', 'Reparacion'),
        ('LISTO', 'Listo'),
    ]
    METODOS_PAGO = [
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('TRANFERENCIA', 'Transferencia'),
    ]

    numero_orden = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        editable=False,
    )
    cliente = models.ForeignKey(Cliente, on_delete=models.RESTRICT, related_name='ordenes')
    descripcion_falla = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='RECIBIDO')
    costo_mano_obra = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_pagar = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fecha_ingreso = models.DateTimeField(auto_now_add=True)
    pagado = models.BooleanField(default=False)
    metodo_pago = models.CharField(
        max_length=20, choices=METODOS_PAGO, blank=True, null=True
    )
    fecha_pago = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ordenes_servicio'

    def _generar_numero_orden(self):
        anio = timezone.now().year
        ultimo_folio = (
            OrdenServicio.objects
            .filter(numero_orden__startswith=f'REP-{anio}-').count()
        )
        folio = ultimo_folio + 1
        return f'REP-{anio}-{folio:04d}'

    def save(self, *args, **kwargs):
        if not self.numero_orden:
            self.numero_orden = self._generar_numero_orden()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.numero_orden} - {self.cliente.nombre}"

class DetalleInventario(models.Model):
    orden = models.ForeignKey(OrdenServicio, on_delete=models.CASCADE, related_name='detalles')
    repuesto = models.ForeignKey(Repuesto, on_delete=models.RESTRICT, related_name='usos')
    cantidad_usada = models.PositiveIntegerField()

    class Meta:
        db_table = 'detalle_inventario'

    def __str__(self):
        return f"{self.repuesto.nombre_pieza} x{self.cantidad_usada}"
    