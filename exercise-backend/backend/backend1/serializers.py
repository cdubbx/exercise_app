from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .models import Exercise, User, SavedWorkout, PlannedWorkout,UserUploadWorkedouts, NowPlayingTrack

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Exercise
        exclude = ['embedding']
        
class UserUploadWorkoutsSerializer(serializers.ModelSerializer):
    img_url = serializers.ListField(child=serializers.URLField(), required=False)  # Ensures correct serialization
    primaryMuscles = serializers.ListField(child=serializers.CharField(), required=False)  # Ensures it's a proper li
    class Meta: 
        model = UserUploadWorkedouts
        fields = '__all__'
        read_only_fields = ['user', 'trainer_verified']
    def create(self, validated_data):
        return super().create(validated_data)

class UserSerializer(serializers.ModelSerializer):
    date_joined = serializers.DateTimeField(format='%Y-%m-%d', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'username', 'streak', 'image_url', 'date_joined', 'weight', 'height', 'goal_weight', 'phone_number', 'is_private', 'is_searchable']
        read_only_fields = ['id', 'streak']
        extra_kwargs = {'password': {'write_only': True, 'required': True}, 'username': {'required': False}}

    def validate_password(self, value):
        from django.contrib.auth.password_validation import validate_password
        validate_password(value, self.instance)
        return value

    def validate(self, data):
        for field in ['weight', 'height', 'goal_weight']:
            if data.get(field) is not None and data[field] <= 0:
                raise serializers.ValidationError({field: 'Must be greater than zero.'})
        if data.get('phone_number') == '':
            data['phone_number'] = None
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)


class PublicUserSerializer(serializers.ModelSerializer):
    date_joined = serializers.DateTimeField(format='%Y-%m-%d', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'image_url', 'date_joined', 'streak', 'is_private', 'is_searchable']


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
    
class PlanRepetitionsField(serializers.IntegerField):
    def to_representation(self, value):
        try:
            return int(value)
        except (ValueError, TypeError):
            return value  # Older app versions allowed free-text repetitions.


class PlannedWorkoutSerializer(serializers.ModelSerializer):
    saved_workout_details = SavedWorkoutSerializer(source='saved_workout', read_only=True)
    exercise = UserUploadWorkoutsSerializer(source='custom_workout', read_only=True)
    reps = PlanRepetitionsField(min_value=1, max_value=1000)
    sets = serializers.IntegerField(min_value=1, max_value=100)

    class Meta:
        model = PlannedWorkout
        fields = '__all__'
        read_only_fields = ['user']
        validators = []  # The view handles repeated submissions idempotently.

    def validate(self, data):
        if bool(data.get('saved_workout')) == bool(data.get('custom_workout')):
            raise serializers.ValidationError('Choose exactly one exercise.')
        return data

class NowPlayingTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = NowPlayingTrack
        fields = '__all__'