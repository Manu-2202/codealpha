from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, Order, OrderItem

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ProductSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)  # Compatibility with MongoDB frontend

    class Meta:
        model = Product
        fields = ['id', '_id', 'name', 'description', 'price', 'category', 'rating', 'reviewsCount', 'stock', 'color', 'imageUrl', 'discount']

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    productId = serializers.IntegerField(write_only=True)

    class Meta:
        model = OrderItem
        fields = ['product', 'productId', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    _id = serializers.CharField(source='id', read_only=True)

    class Meta:
        model = Order
        fields = ['id', '_id', 'items', 'totalAmount', 'shippingAddress', 'status', 'created_at']
