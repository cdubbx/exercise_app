from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .models import Exercise, User, SavedWorkout, PlannedWorkout

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Exercise
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'username']

        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'required': False}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)

        if password is not None:
            instance.set_password(password)
        # instance.is_active = False
        instance.save()
        return instance
        
class SavedWorkoutSerializer(serializers.ModelSerializer):
    exercise_id = serializers.UUIDField(write_only=True)
    exercise = ExerciseSerializer(read_only=True)

    class Meta:
        model = SavedWorkout
        fields = ['id', 'user', 'exercise', 'exercise_id', 'date_saved']
        extra_kwargs = {
            'user': {'read_only': True},
            'date_saved': {'read_only': True}
        }

    def create(self, validated_data):
        exercise_id = validated_data.pop('exercise_id')
        exercise = Exercise.objects.get(id=exercise_id)
        saved_workout = SavedWorkout.objects.create(exercise=exercise, **validated_data)
        return saved_workout
    
class PlannedWorkoutSerializer(serializers.ModelSerializer):
    saved_workout = serializers.PrimaryKeyRelatedField(queryset=SavedWorkout.objects.all())
    saved_workout_details = SavedWorkoutSerializer(source='saved_workout', read_only=True)
    class Meta:
        model = PlannedWorkout
        fields = '__all__'