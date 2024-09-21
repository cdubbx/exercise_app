from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import CustomerUserManager
from django.conf import settings

from uuid import uuid4
import uuid
# Create your models here.
class User(AbstractUser):
    email = models.CharField(max_length = 255, unique = True)
    password = models.CharField(max_length = 255)
    username = models.CharField(max_length=255, unique=True, null=True, blank=True)  # Make username optional
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    otp = models.CharField(null=True, blank=True, max_length=255)
    REQUIRED_FIELDS = []
    USERNAME_FIELD = 'email'

    

    def __str__(self) -> str:
        return self.email

class Exercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=255)
    aliases = models.JSONField(blank=True, null=True)
    primaryMuscles = models.JSONField(blank = True, null = True)
    secondaryMuscles = models.JSONField(blank=True, null=True)
    force = models.CharField(max_length=50, null = True)
    level = models.CharField(max_length=50, null = True)
    mechanic = models.CharField(max_length=50, blank=True, null=True)
    equipment = models.CharField(max_length=50, null =True)
    category = models.CharField(max_length=50,  null = True)
    instructions = models.JSONField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    tips = models.JSONField(blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    img_url = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.name
    
class SavedWorkout(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_saved')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='saved_workouts')
    date_saved = models.DateTimeField(auto_now_add=True)
    reps = models.CharField(max_length=250, null=True, blank=True)

    class Meta:
        unique_together = ('user', 'exercise')  # Optional: ensures a user can't save the same exercise multiple times

    def __str__(self):
        return f"{self.user.email} - {self.exercise.name}"

class PlannedWorkout(models.Model):
    DAYS_OF_WEEK = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='planned_workouts')
    saved_workout = models.ForeignKey(SavedWorkout, on_delete=models.CASCADE, related_name='planned_workouts')
    day_of_the_week = models.CharField(max_length=9)
    reps = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} - {self.saved_workout.exercise.name} on {self.day_of_the_week}"
    
    