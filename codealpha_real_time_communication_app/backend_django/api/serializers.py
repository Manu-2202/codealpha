from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Room

class UserSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)

    class Meta:
        model = User
        fields = ['id', '_id', 'username', 'email']

class RoomSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)
    creator = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Room
        fields = ['id', '_id', 'room_id', 'description', 'creator', 'created_at']
