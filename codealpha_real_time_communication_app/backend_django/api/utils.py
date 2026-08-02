import jwt
import datetime
from django.contrib.auth.models import User
from rest_framework.exceptions import AuthenticationFailed

SECRET_KEY = 'nexcall_secret_key_2026'

def generate_token(user):
    payload = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def get_authenticated_user(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise AuthenticationFailed('No authorization header provided')

    tokens = auth_header.split()
    if len(tokens) != 2 or tokens[0].lower() != 'bearer':
        raise AuthenticationFailed('Token format must be Bearer <token>')

    try:
        payload = jwt.decode(tokens[1], SECRET_KEY, algorithms=['HS256'])
        return User.objects.get(id=payload.get('id'))
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('The token has expired')
    except (jwt.InvalidTokenError, User.DoesNotExist):
        raise AuthenticationFailed('The token is invalid')
