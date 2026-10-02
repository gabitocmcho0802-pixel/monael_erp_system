from django.db import models

class Producto(models.Model):
    CATEGORIA_OPCIONES = [
        ('ALIANZAS' , 'Alianzas'),
        ('COMPROMISO' , 'Compromiso'),
        ('RELOJ' , 'Reloj'),
        ('COLLAR', 'Collar')
    ]

    MATERIAL_OPCIONES = [
        ('TUNGSTENO' , 'Tungsteno'),
        ('PLATA', 'Plata Ley 925'),
        ('TITANIO', 'Titanio'),
        ('ACERO', 'Acero 316l')
    ]

    GAMA_OPCIONES = [
        ('ALTA', 'Gama Alta'),
        ('MEDIA', 'Gama Media'),
        ('BAJA', 'Gama Baja'),
    ]

    codigo = models.CharField(max_length=10, unique=True)
    nombre = models.CharField(max_length=30)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_OPCIONES)
    material = models.CharField(max_length=20, choices=MATERIAL_OPCIONES)
    gama = models.CharField(max_length=20, choices=GAMA_OPCIONES)
    precio = models.DecimalField(max_digits=9, decimal_places=2)
    imagen = models.ImageField(upload_to='productos', blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"({self.nombre}) {self.codigo}"

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['-id']


class VarianteProducto(models.Model):
    GENERO_OPCIONES = [
        ('MUJER', 'Mujer'),
        ('HOMBRE', 'Hombre'),
        ('UNISEX', 'Unisex'),
    ]

    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='variantes')
    talla = models.CharField(max_length=5)
    genero = models.CharField(max_length=10, choices=GENERO_OPCIONES)
    stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"({self.producto.nombre}) {self.talla} - {self.genero} - Stock: {self.stock}"


class Promocion(models.Model):

    TIPO_DESCUENTO_OPCIONES = [
        ('PORCENTAJE', 'Porcentaje'),
        ('MONTO', 'Monto'),
    ]

    nombre = models.CharField(max_length=50)
    tipo_descuento = models.CharField(max_length=10, choices=TIPO_DESCUENTO_OPCIONES)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    estado = models.BooleanField(default=True)

    def __str__(self):
        return f"({self.nombre} | {self.tipo_descuento} | {self.estado})"


class ProductoPromocion(models.Model):
    promocion = models.ForeignKey(Promocion, on_delete=models.CASCADE, related_name='productos_asociados')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='promociones_directas')
    valor_descuento = models.DecimalField(max_digits=9, decimal_places=2)
    cantidad_minima = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.promocion.nombre} -> {self.producto.nombre}"


class PromocionCriterio(models.Model):
    promocion = models.ForeignKey(Promocion, on_delete=models.CASCADE, related_name='criterios')
    categoria = models.CharField(max_length=20, choices=Producto.CATEGORIA_OPCIONES, null=True, blank=True)
    material = models.CharField(max_length=20, choices=Producto.MATERIAL_OPCIONES, null=True, blank=True)
    gama = models.CharField(max_length=20, choices=Producto.GAMA_OPCIONES, null=True, blank=True)

    def __str__(self):
        criterios_activos = []
        if self.categoria: criterios_activos.append(f"Cat: {self.categoria}")
        if self.material: criterios_activos.append(f"Mat: {self.material}")
        if self.gama: criterios_activos.append(f"Gama: {self.gama}")
        return f"Criterio para {self.promocion.nombre}: {', '.join(criterios_activos)}"