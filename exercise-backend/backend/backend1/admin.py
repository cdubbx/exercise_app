from django.contrib import admin
from .models import Exercise, User,SavedWorkout, PlannedWorkout

admin.site.register(Exercise)
admin.site.register(User)
admin.site.register(SavedWorkout)
admin.site.register(PlannedWorkout)
