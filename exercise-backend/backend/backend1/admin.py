from django.contrib import admin
from .models import Exercise, User,SavedWorkout, PlannedWorkout, NowPlayingTrack

admin.site.register(Exercise)
admin.site.register(User)
admin.site.register(SavedWorkout)
admin.site.register(PlannedWorkout)
admin.site.register(NowPlayingTrack)
