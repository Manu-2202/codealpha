from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import Room
from .serializers import RoomSerializer, UserSerializer
from .utils import generate_token, get_authenticated_user

# Seed rooms
MOCK_ROOMS = [
    {"room_id": "lobby-sprint", "description": "Core sprint tracking for NexFlow release."},
    {"room_id": "webrtc-test", "description": "Testing audio/video stream parameters."}
]

def seed_rooms_if_empty(default_user):
    if Room.objects.count() == 0:
        for r in MOCK_ROOMS:
            Room.objects.create(
                room_id=r["room_id"],
                description=r["description"],
                created_by=default_user
            )

@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not email or not password:
        return Response({'message': 'Please fill all fields'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'message': 'Username is already taken'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'message': 'Email is already registered'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        token = generate_token(user)
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
            token = generate_token(user)
            return Response({
                'token': token,
                'user': UserSerializer(user).data
            })
        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET', 'POST'])
def room_list_create(request):
    try:
        user = get_authenticated_user(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        seed_rooms_if_empty(user)
        rooms = Room.objects.all().order_by('-created_at')
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        room_id = request.data.get('roomId')
        description = request.data.get('description')

        if not room_id:
            return Response({'message': 'Room ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        if Room.objects.filter(room_id=room_id).exists():
            return Response({'message': 'Room already exists'}, status=status.HTTP_400_BAD_REQUEST)

        room = Room.objects.create(
            room_id=room_id,
            description=description,
            created_by=user
        )
        return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)
