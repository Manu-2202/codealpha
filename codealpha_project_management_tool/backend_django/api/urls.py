from django.urls import path
from . import views

urlpatterns = [
    path('auth/register', views.register_user, name='register'),
    path('auth/login', views.login_user, name='login'),
    path('projects/boards', views.board_list_create, name='boards'),
    path('projects/boards/<int:boardId>/tasks', views.task_list, name='tasks'),
    path('projects/tasks', views.task_create, name='task-create'),
    path('projects/tasks/<int:pk>', views.task_update, name='task-update'),
    path('projects/tasks/<int:pk>/comment', views.task_add_comment, name='task-comment'),
]
