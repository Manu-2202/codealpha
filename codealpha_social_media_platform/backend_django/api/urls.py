from django.urls import path
from . import views

urlpatterns = [
    path('auth/register', views.register_user, name='register'),
    path('auth/login', views.login_user, name='login'),
    path('posts', views.post_list_create, name='posts'),
    path('posts/<int:pk>/like', views.like_post, name='like-post'),
    path('posts/<int:pk>/comment', views.comment_post, name='comment-post'),
    path('users/<int:pk>/profile', views.user_profile, name='user-profile'),
    path('users/<int:pk>/follow', views.follow_user, name='follow-user'),
    path('users/profile', views.update_profile, name='update-profile'),
]
