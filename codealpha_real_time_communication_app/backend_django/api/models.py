from django.db import models
from django.contrib.auth.models import User

class Room(models.Model):
    room_id = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rooms')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.room_id
