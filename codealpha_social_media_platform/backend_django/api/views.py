from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Profile, Post, Comment
from .serializers import PostSerializer, ProfileSerializer, CommentSerializer, UserSerializer
from .utils import generate_jwt_token, get_user_from_request

# Seed posts data
MOCK_POSTS = [
    {
        "username": "alex_cyber",
        "content": "Just launched our new glassmorphic UI framework! The future of web aesthetics is all about transparency, blur, and deep shadows. Web design is evolving so fast. 🚀✨",
        "imageUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
    },
    {
        "username": "lisa_tech",
        "content": "Spent the morning testing React Server Components vs standard client rendering. The performance gains on slow mobile networks are absolutely massive. RSCs are here to stay!",
        "imageUrl": ""
    },
    {
        "username": "marcus_dev",
        "content": "Late night debugging session. Found a memory leak caused by a missing cleanup function in a useEffect hook. Remember to always clean up your subscriptions and intervals, folks! 💻💤",
        "imageUrl": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=80"
    }
]

def seed_posts_if_empty():
    if Post.objects.count() == 0:
        # Create users
        for post_data in MOCK_POSTS:
            u_name = post_data["username"]
            email = f"{u_name}@example.com"
            user, created = User.objects.get_or_create(username=u_name, email=email)
            if created:
                user.set_password("password123")
                user.save()
            
            # Setup mock bio/avatar
            profile = user.profile
            profile.bio = f"Technology enthusiast and professional developer. Team lead of {u_name} projects."
            profile.avatar_url = f"https://api.dicebear.com/7.x/bottts/svg?seed={u_name}"
            profile.save()

            # Create post
            Post.objects.create(
                user=user,
                content=post_data["content"],
                imageUrl=post_data["imageUrl"] if post_data["imageUrl"] else None
            )
        print("Seeded mock social media posts into Django SQLite DB.")

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
        # Default bio/avatar
        profile = user.profile
        profile.avatar_url = f"https://api.dicebear.com/7.x/bottts/svg?seed={username}"
        profile.save()

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
def post_list_create(request):
    seed_posts_if_empty()

    if request.method == 'GET':
        posts = Post.objects.all().order_by('-created_at')
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        try:
            user = get_user_from_request(request)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        content = request.data.get('content')
        image_url = request.data.get('imageUrl')

        if not content:
            return Response({'message': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)

        post = Post.objects.create(
            user=user,
            content=content,
            imageUrl=image_url if image_url else None
        )
        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def like_post(request, pk):
    try:
        user = get_user_from_request(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response({'message': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    if post.likes.filter(id=user.id).exists():
        post.likes.remove(user)
        action = "unliked"
    else:
        post.likes.add(user)
        action = "liked"

    post.save()
    return Response({
        'likes': [u.id for u in post.likes.all()],
        'action': action
    })

@api_view(['POST'])
def comment_post(request, pk):
    try:
        user = get_user_from_request(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response({'message': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    content = request.data.get('content')
    if not content:
        return Response({'message': 'Comment content is required'}, status=status.HTTP_400_BAD_REQUEST)

    comment = Comment.objects.create(
        post=post,
        user=user,
        content=content
    )
    return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def user_profile(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    profile = user.profile
    posts = Post.objects.filter(user=user).order_by('-created_at')

    return Response({
        'profile': ProfileSerializer(profile).data,
        'posts': PostSerializer(posts, many=True).data
    })

@api_view(['POST'])
def follow_user(request, pk):
    try:
        user = get_user_from_request(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    if user.id == int(pk):
        return Response({'message': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_to_follow = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    profile = user.profile
    if profile.following.filter(id=user_to_follow.id).exists():
        profile.following.remove(user_to_follow)
        action = "unfollowed"
    else:
        profile.following.add(user_to_follow)
        action = "followed"

    profile.save()
    return Response({
        'following': [u.id for u in profile.following.all()],
        'followersCount': user_to_follow.followers.count(),
        'action': action
    })

@api_view(['PUT'])
def update_profile(request):
    try:
        user = get_user_from_request(request)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    profile = user.profile
    bio = request.data.get('bio')
    avatar_url = request.data.get('avatar_url')

    if bio is not None:
        profile.bio = bio
    if avatar_url is not None:
        profile.avatar_url = avatar_url

    profile.save()
    return Response(ProfileSerializer(profile).data)
