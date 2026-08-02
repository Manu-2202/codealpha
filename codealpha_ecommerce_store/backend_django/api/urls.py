from django.urls import path
from . import views

urlpatterns = [
    path('auth/register', views.register_user, name='register'),
    path('auth/login', views.login_user, name='login'),
    path('products', views.product_list, name='products'),
    path('products/<int:pk>', views.product_detail, name='product-detail'),
    path('orders', views.order_list_create, name='orders'),
]
