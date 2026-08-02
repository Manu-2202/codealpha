from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Board, Task, TaskComment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class BoardSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)

    class Meta:
        model = Board
        fields = ['id', '_id', 'title', 'description']

class TaskCommentSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)
    text = serializers.CharField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', '_id', 'username', 'avatarColor', 'text', 'createdAt', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    board = serializers.CharField(source='board.id', read_only=True)

    class Meta:
        model = Task
        fields = ['id', '_id', 'board', 'title', 'description', 'status', 'priority', 'dueDate', 'assignee', 'comments']
