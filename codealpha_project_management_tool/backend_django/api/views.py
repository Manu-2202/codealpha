from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db import transaction
from .models import Board, Task, TaskComment
from .serializers import BoardSerializer, TaskSerializer, TaskCommentSerializer, UserSerializer
from .utils import generate_jwt_token, get_user_from_request
import datetime

def seed_default_project(user):
    # Create default board
    board = Board.objects.create(
        title="Sprint Development Board",
        description="Core sprint tracking for NexFlow release.",
        user=user
    )

    # Create default tasks
    tasks = [
        {
            "board": board,
            "title": "Design glassmorphic dark UI mockup",
            "description": "Design high-fidelity dashboard layouts with vibrant glows and blur backdrops.",
            "status": "Done",
            "priority": "High",
            "assignee": user.username,
            "dueDate": datetime.datetime.now() + datetime.timedelta(days=2)
        },
        {
            "board": board,
            "title": "Setup Node.js Express server routes",
            "description": "Setup JWT middleware and database connections to MongoDB.",
            "status": "In Progress",
            "priority": "Medium",
            "assignee": user.username,
            "dueDate": datetime.datetime.now() + datetime.timedelta(days=5)
        },
        {
            "board": board,
            "title": "Implement WebRTC media channels",
            "description": "Integrate peer-to-peer signaling sockets for real-time screenshare and streaming.",
            "status": "To Do",
            "priority": "High",
            "assignee": "Unassigned",
            "dueDate": datetime.datetime.now() + datetime.timedelta(days=10)
        }
    ]

    for t_data in tasks:
        task = Task.objects.create(**t_data)
        # Add a default system comment to the first task
        if t_data["status"] == "Done":
            TaskComment.objects.create(
                task=task,
                username="System Manager",
                avatarColor="#6366f1",
                text="Approved by client."
            )
            
    print(f"Seeded default project board & tasks for user: {user.username}")

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
def board_list_create(request):
    try:
        user = get_user_from_request(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        boards = Board.objects.filter(user=user)
        if boards.count() == 0:
            seed_default_project(user)
            boards = Board.objects.filter(user=user)
        
        serializer = BoardSerializer(boards, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        title = request.data.get('title')
        description = request.data.get('description')

        if not title:
            return Response({'message': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)

        board = Board.objects.create(
            title=title,
            description=description,
            user=user
        )
        return Response(BoardSerializer(board).data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def task_list(request, boardId):
    try:
        user = get_user_from_request(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        board = Board.objects.get(pk=boardId, user=user)
    except Board.DoesNotExist:
        return Response({'message': 'Board not found'}, status=status.HTTP_404_NOT_FOUND)

    tasks = Task.objects.filter(board=board)
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def task_create(request):
    try:
        user = get_user_from_request(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    boardId = request.data.get('boardId')
    title = request.data.get('title')
    description = request.data.get('description')
    priority = request.data.get('priority', 'Medium')
    dueDate = request.data.get('dueDate')
    assignee = request.data.get('assignee', 'Unassigned')

    if not boardId or not title:
        return Response({'message': 'Board ID and Title are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        board = Board.objects.get(pk=boardId, user=user)
    except Board.DoesNotExist:
        return Response({'message': 'Board not found'}, status=status.HTTP_404_NOT_FOUND)

    task = Task.objects.create(
        board=board,
        title=title,
        description=description,
        priority=priority,
        dueDate=dueDate if dueDate else None,
        assignee=assignee
    )
    return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)

@api_view(['PUT'])
def task_update(request, pk):
    try:
        user = get_user_from_request(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        task = Task.objects.get(pk=pk, board__user=user)
    except Task.DoesNotExist:
        return Response({'message': 'Task card not found'}, status=status.HTTP_404_NOT_FOUND)

    title = request.data.get('title')
    description = request.data.get('description')
    status_val = request.data.get('status')
    priority = request.data.get('priority')
    dueDate = request.data.get('dueDate')
    assignee = request.data.get('assignee')

    if title is not None:
        task.title = title
    if description is not None:
        task.description = description
    if status_val is not None:
        task.status = status_val
    if priority is not None:
        task.priority = priority
    if dueDate is not None:
        task.dueDate = dueDate if dueDate else None
    if assignee is not None:
        task.assignee = assignee

    task.save()
    return Response(TaskSerializer(task).data)

@api_view(['POST'])
def task_add_comment(request, pk):
    try:
        user = get_user_from_request(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        task = Task.objects.get(pk=pk, board__user=user)
    except Task.DoesNotExist:
        return Response({'message': 'Task card not found'}, status=status.HTTP_404_NOT_FOUND)

    text = request.data.get('text')
    if not text:
        return Response({'message': 'Comment text is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Assign random avatar color
    colors = ["#6366f1", "#a855f7", "#10b981", "#ec4899", "#f59e0b"]
    import random
    avatar_color = colors[random.randint(0, len(colors)-1)]

    comment = TaskComment.objects.create(
        task=task,
        username=user.username,
        avatarColor=avatar_color,
        text=text
    )
    comments = TaskComment.objects.filter(task=task)
    return Response(TaskCommentSerializer(comments, many=True).data, status=status.HTTP_201_CREATED)
