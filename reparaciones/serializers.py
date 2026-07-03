from rest_framework import serializers
from .models import Cliente, Repuesto, OrdenServicio, DetalleInventario

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class RepuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Repuesto
        fields = '__all__'

class DetalleInventarioSerializer(serializers.ModelSerializer):
    repuesto_nombre = serializers.CharField(source='repuesto.nombre_pieza', read_only=True)
    precio_unitario = serializers.DecimalField(source='repuesto.precio_unitario', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = DetalleInventario
        fields = '__all__'

class OrdenServicioSerializer(serializers.ModelSerializer):
    detalles = DetalleInventarioSerializer(many=True, read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)

    class Meta:
        model = OrdenServicio
        fields = '__all__'