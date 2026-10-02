from django import forms
from .models import Producto

class ProductoForm(forms.ModelForm):
    imagen = forms.ImageField(required=False)

    class Meta:
        model = Producto
        fields = '__all__'