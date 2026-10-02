from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, DeleteView, UpdateView
from .models import Producto, VarianteProducto
from .forms import ProductoForm


class ProductoLista(ListView):
    model = Producto
    template_name = 'appInventario/inventario.html'
    context_object_name = 'productos'
    paginate_by = 100
    ordering = ['-id']

    def get_queryset(self):
        # Optimiza la consulta trayendo las variantes asociadas para mostrarlas en la tabla y modales
        return Producto.objects.prefetch_related('variantes').all().order_by('-id')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = ProductoForm()
        context['genero_opciones'] = VarianteProducto.GENERO_OPCIONES
        context['categoria_opciones'] = Producto.CATEGORIA_OPCIONES
        context['material_opciones'] = Producto.MATERIAL_OPCIONES
        context['gama_opciones'] = Producto.GAMA_OPCIONES
        return context


class ProductoCreate(CreateView):
    model = Producto
    form_class = ProductoForm
    template_name = 'appInventario/inventario.html'
    success_url = reverse_lazy('inventario:lista_productos')

    def form_valid(self, form):
        # 1. Guarda el producto principal (la imagen se guarda automáticamente si fue enviada)
        self.object = form.save()

        # 2. Lee las variantes del formulario modal
        tallas = self.request.POST.getlist('talla')
        generos = self.request.POST.getlist('genero')
        stocks = self.request.POST.getlist('stock')

        for t, g, s in zip(tallas, generos, stocks):
            t_clean = t.strip() if t else ''
            g_clean = g.strip() if g else ''
            if t_clean and g_clean:
                try:
                    stock_val = int(s) if s else 0
                except (ValueError, TypeError):
                    stock_val = 0

                VarianteProducto.objects.create(
                    producto=self.object,
                    talla=t_clean,
                    genero=g_clean,
                    stock=stock_val
                )

        return redirect(self.get_success_url())


class ProductoUpdate(UpdateView):
    model = Producto
    form_class = ProductoForm
    template_name = 'appInventario/inventario.html'
    success_url = reverse_lazy('inventario:lista_productos')

    def form_valid(self, form):
        # 1. Manejo de eliminación o reemplazo de imagen
        eliminar_imagen = self.request.POST.get('eliminar_imagen')
        nueva_imagen = self.request.FILES.get('imagen')

        if eliminar_imagen:
            if self.object.imagen:
                try:
                    self.object.imagen.delete(save=False)
                except Exception:
                    pass
            self.object.imagen = None
            form.instance.imagen = None
        elif nueva_imagen and self.object.imagen:
            # Si subió una nueva imagen y ya tenía otra previa en disco, borrar la antigua
            try:
                self.object.imagen.delete(save=False)
            except Exception:
                pass

        # Guarda cambios del producto
        self.object = form.save()

        # 2. Manejo y edición completa de tallas/variantes
        variante_ids = self.request.POST.getlist('variante_id')
        tallas = self.request.POST.getlist('talla')
        generos = self.request.POST.getlist('genero')
        stocks = self.request.POST.getlist('stock')

        ids_procesados = []
        for v_id, t, g, s in zip(variante_ids, tallas, generos, stocks):
            t_clean = t.strip() if t else ''
            g_clean = g.strip() if g else ''
            if t_clean and g_clean:
                try:
                    stock_val = int(s) if s else 0
                except (ValueError, TypeError):
                    stock_val = 0

                if v_id and str(v_id).isdigit():
                    # Actualizar variante existente
                    variante = VarianteProducto.objects.filter(id=int(v_id), producto=self.object).first()
                    if variante:
                        variante.talla = t_clean
                        variante.genero = g_clean
                        variante.stock = stock_val
                        variante.save()
                        ids_procesados.append(variante.id)
                else:
                    # Crear nueva variante añadida en la edición
                    nueva_v = VarianteProducto.objects.create(
                        producto=self.object,
                        talla=t_clean,
                        genero=g_clean,
                        stock=stock_val
                    )
                    ids_procesados.append(nueva_v.id)

        # Elimina las variantes que el usuario haya retirado en el modal de edición
        self.object.variantes.exclude(id__in=ids_procesados).delete()

        return redirect(self.get_success_url())


class ProductoDelete(DeleteView):
    model = Producto
    template_name = 'appInventario/inventario.html'
    success_url = reverse_lazy('inventario:lista_productos')

    def form_valid(self, form):
        # Al eliminar el producto, elimina físicamente su archivo de imagen en disco
        if self.object.imagen:
            try:
                self.object.imagen.delete(save=False)
            except Exception:
                pass
        return super().form_valid(form)
