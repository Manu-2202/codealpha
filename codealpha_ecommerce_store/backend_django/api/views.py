from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import transaction
from .models import Product, Order, OrderItem
from .serializers import ProductSerializer, OrderSerializer, UserSerializer
from .utils import generate_jwt_token, get_user_from_request

# Seed products list
MOCK_PRODUCTS = [
    {
        "name": "AeroPro Wireless Headphones",
        "description": "Experience premium active noise cancelling sound with lightweight ergonomic ear cushions and up to 40 hours of battery life.",
        "price": 19999.00,
        "category": "electronics",
        "rating": 4.8,
        "reviewsCount": 124,
        "stock": 15,
        "color": "#a855f7",
        "imageUrl": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
        "discount": 10
    },
    {
        "name": "Quantum Smart Watch",
        "description": "Track your health metrics, sync workouts, and receive real-time notifications on a bright crystal clear OLED display.",
        "price": 15999.00,
        "category": "wearables",
        "rating": 4.6,
        "reviewsCount": 89,
        "stock": 8,
        "color": "#ec4899",
        "imageUrl": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80",
        "discount": 15
    },
    {
        "name": "Ergonomic Mechanical Keyboard",
        "description": "Hot-swappable switches, dynamic RGB backlighting, and a premium aluminum top frame for maximum typing efficiency and speed.",
        "price": 9999.00,
        "category": "accessories",
        "rating": 4.7,
        "reviewsCount": 210,
        "stock": 22,
        "color": "#3b82f6",
        "imageUrl": "https://images.unsplash.com/photo-1618384887929-16ec33faf9c1?w=600&auto=format&fit=crop&q=80",
        "discount": 0
    },
    {
        "name": "Ultra-Wide Curve Monitor 34\"",
        "description": "Immersive 1500R curvature, 144Hz refresh rate, and 3440 x 1440 resolution for a cinema-grade gaming and productivity setup.",
        "price": 49999.00,
        "category": "electronics",
        "rating": 4.9,
        "reviewsCount": 65,
        "stock": 5,
        "color": "#10b981",
        "imageUrl": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
        "discount": 20
    },
    {
        "name": "FitTrack Smart Scale",
        "description": "Syncs weight, body fat %, muscle mass, and water content to your smartphone app automatically via Bluetooth.",
        "price": 3999.00,
        "category": "wearables",
        "rating": 4.2,
        "reviewsCount": 312,
        "stock": 40,
        "color": "#f59e0b",
        "imageUrl": "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&auto=format&fit=crop&q=80",
        "discount": 5
    },
    {
        "name": "USB-C Multi-Port Hub",
        "description": "8-in-1 expansion dock featuring HDMI 4K, SD card slots, USB 3.0 ports, and 100W Power Delivery pass-through.",
        "price": 4999.00,
        "category": "accessories",
        "rating": 4.5,
        "reviewsCount": 178,
        "stock": 18,
        "color": "#ef4444",
        "imageUrl": "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&auto=format&fit=crop&q=80",
        "discount": 0
    }
]

@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not email or not password:
        return Response({'message': 'Please enter all fields'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'message': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({'message': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        token = generate_jwt_token(user)
        return Response({
            'token': token,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def login_user(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'message': 'Please provide email and password'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            token = generate_jwt_token(user)
            return Response({
                'token': token,
                'user': UserSerializer(user).data
            })
        else:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET', 'POST'])
def product_list(request):
    if request.method == 'GET':
        # Seed if empty
        if Product.objects.count() == 0:
            for p in MOCK_PRODUCTS:
                Product.objects.create(**p)
            print("Seeded mock products into Django SQLite DB.")

        category = request.query_params.get('category')
        search = request.query_params.get('search')

        products = Product.objects.all()

        if category and category != 'all':
            products = products.filter(category=category)

        if search:
            products = products.filter(name__icontains=search) | products.filter(description__icontains=search)

        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def product_detail(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        product.delete()
        return Response({'message': 'Product removed'})

@api_view(['GET', 'POST'])
def order_list_create(request):
    try:
        user = get_user_from_request(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        orders = Order.objects.filter(user=user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        items_data = request.data.get('items', [])
        total_amount = request.data.get('totalAmount')
        shipping_address = request.data.get('shippingAddress')

        if not items_data or total_amount is None or not shipping_address:
            return Response({'message': 'Missing order details'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                order = Order.objects.create(
                    user=user,
                    totalAmount=total_amount,
                    shippingAddress=shipping_address
                )
                for item in items_data:
                    prod_id = item.get('productId') or item.get('product', {}).get('id') or item.get('product', {}).get('_id')
                    product = Product.objects.get(pk=int(prod_id))
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=item.get('quantity', 1),
                        price=item.get('price', product.price)
                    )
                serializer = OrderSerializer(order)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
