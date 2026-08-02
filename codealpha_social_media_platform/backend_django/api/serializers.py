from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Post, Comment

class UserSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(source='profile.bio', read_only=True)
    avatar_url = serializers.CharField(source='profile.avatar_url', read_only=True)
    _id = serializers.CharField(source='id', read_only=True)

    class Meta:
        model = User
        fields = ['id', '_id', 'username', 'email', 'bio', 'avatar_url']

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    id = serializers.IntegerField(source='user.id', read_only=True)
    _id = serializers.CharField(source='user.id', read_only=True)
    followersCount = serializers.SerializerMethodField()
    followingCount = serializers.SerializerMethodField()
    following = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = ['id', '_id', 'username', 'email', 'bio', 'avatar_url', 'followersCount', 'followingCount', 'following']

    def get_followersCount(self, obj):
        return obj.user.followers.count()

    def get_followingCount(self, obj):
        return obj.following.count()

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', '_id', 'user', 'content', 'createdAt', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    _id = serializers.CharField(source='id', read_only=True)
    likes = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Post
        fields = ['id', '_id', 'user', 'content', 'imageUrl', 'likes', 'comments', 'createdAt', 'created_at']
