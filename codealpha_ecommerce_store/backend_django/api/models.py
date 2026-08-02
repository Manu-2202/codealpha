from django.db import models
from django.contrib.auth.models import User

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    reviewsCount = models.IntegerField(default=0)
    stock = models.IntegerField(default=0)
    color = models.CharField(max_length=50, default='#6366f1')
    imageUrl = models.CharField(max_length=500, blank=True, null=True)
    discount = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    totalAmount = models.DecimalField(max_digits=10, decimal_places=2)
    shippingAddress = models.CharField(max_length=500)
    status = models.CharField(max_length=100, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name if self.product else 'Deleted Product'} (Order {self.order.id})"
