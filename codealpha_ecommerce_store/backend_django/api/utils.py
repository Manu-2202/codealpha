import jwt
import datetime
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import exceptions

JWT_SECRET = 'taskflow_secret_key_2026'  # Matches or fallback

def generate_jwt_token(user):
    payload = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30),
        'iat': datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    return token

def get_user_from_request(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise exceptions.AuthenticationFailed('Authorization header missing')

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise exceptions.AuthenticationFailed('Authorization header must be Bearer <token>')

    token = parts[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = payload.get('id')
        user = User.objects.get(id=user_id)
        return user
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed('Token has expired')
    except (jwt.InvalidTokenError, User.DoesNotExist):
        raise exceptions.AuthenticationFailed('Invalid token')
