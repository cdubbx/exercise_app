from django.shortcuts import render
from rest_framework import viewsets,status
from .models import Exercise, User, SavedWorkout,PlannedWorkout
from .serializers import ExerciseSerializer, UserSerializer, SavedWorkoutSerializer,PlannedWorkoutSerializer
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authentication import get_authorization_header, TokenAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.http import JsonResponse
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from uuid import uuid4
import logging
logger = logging.getLogger(__name__)

import jwt
import datetime


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    authentication_classes = [TokenAuthentication]  # For token authentication
    permission_classes = [AllowAny]
# Create your views here.

class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = UserSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            return Response({
                'user': serializer.data,
                'refresh': str(refresh),
                'access': str(access),
            })

        except Exception as e:
            logger.error('An unexpected error occurred in RegisterAPIView', exc_info=True)
            return Response({'error': str(e)}, status=500)
        
class LoginAPIView(APIView):
    permission_classes = [AllowAny]  # Allow any user to access this view

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        logger.debug('Received email: %s', email)
        logger.debug('Received password: %s', password)

        user = User.objects.filter(email=email).first()

        if user is None:
            logger.error('User not found with email: %s', email)
            raise AuthenticationFailed('User not found')
        if not user.check_password(password):
            logger.error('Invalid password for user: %s', email)
            raise AuthenticationFailed('Invalid password')

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        response = Response()

        response.data = {
            'refresh': str(refresh),
            'access': str(access),
        }

        return response

class UserView(APIView):
    def get(self, request):
        auth = get_authorization_header(request).split()
        
        if not auth or auth[0].lower() != b'bearer':
            raise AuthenticationFailed('Unauthenticated')
        
        try:
            token = auth[1]
            payload = jwt.decode(token, 'access_secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Unauthenticated')
        
        user = User.objects.filter(id=payload['id']).first()
        serializer = UserSerializer(user)

        return Response(serializer.data)

class ValidateTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"detail": "Token is valid"})    
    
    
class LogoutView(APIView):
    def post(self,request):
        response = Response()
        response.delete_cookie('jwt')
        response.data = {
            'message': 'successful'
        }
        return response

class TokenRefreshView(APIView):
    
    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if refresh_token is None:
            raise AuthenticationFailed('Refresh token required')
        try:
            payload = jwt.decode(refresh_token, 'refresh_secret', algorithms = ["HS256"])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Expire refresh token, please login again')
        
        user = User.objects.filter(id=payload['id']).first()
        if not user:
            raise AuthenticationFailed('Unauthenticated')
        
        

        access_token_payload = {
            "id": user.id,
            "exp":datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
            "iat": datetime.datetime.utcnow()
        }

        new_acccess_token = jwt.encode(access_token_payload, 'access_secret', algorithm = "HS256")


        new_refresh_token_payload = {
            "id": payload['id'],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
            "iat": datetime.datetime.utcnow()
        }

        new_refresh_token = jwt.encode(new_refresh_token_payload,"refresh_secret", algorithm = 'HS256')


        return Response({
            'access_token': new_acccess_token,
            'refresh_token': new_refresh_token
        })
    

class UserSavedWorkoutsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        # Use select_related to fetch related Exercise objects efficiently
        saved_workouts = SavedWorkout.objects.filter(user=user).select_related('exercise')
        serializer = SavedWorkoutSerializer(saved_workouts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
class SaveWorkOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        logger.debug(f'Authenticated user: {user}')  # Debugging line

        if not user:
            return Response({"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        workout_data = request.data.get('workout', {})
        exercise_id = workout_data.get('id')
        

        if not exercise_id:
            return Response({"error": "Exercise ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        saved_workout_data = {'exercise_id': exercise_id}

        serializer = SavedWorkoutSerializer(data=saved_workout_data)
        if serializer.is_valid():
            workout = serializer.save(user=user)
            return Response({"workout": workout.id}, status=status.HTTP_201_CREATED)
        else:
            logger.debug(f'Serializer errors: {serializer.errors}')  # Debugging line
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserPlannedWorkoutsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        planned_workouts = PlannedWorkout.objects.filter(user=user).select_related('saved_workout', 'saved_workout__exercise')
        serializer = PlannedWorkoutSerializer(planned_workouts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        user = request.user
        request.data['user'] = user.id  # Set the user
        workout_data = request.data.get('workout', {})
        workout = workout_data.get('workout', {})
        saved_workout_id = workout.get('id')
        day_of_the_week = workout_data.get('day')
        reps = workout_data.get('reps')
        
        if not saved_workout_id or not day_of_the_week:
            return Response({"error": "Both saved_workout and day_of_the_week are required."}, status=status.HTTP_400_BAD_REQUEST)
        
     
        data = {
            'user': user.id,
            'saved_workout': saved_workout_id,
            'day_of_the_week': day_of_the_week,
            'reps': reps
        }
        

        serializer = PlannedWorkoutSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CheckAuthenticationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # At this point, DRF's authentication mechanisms have already checked the token
        # and populated request.user based on the token's validity.
        
        if request.user.is_authenticated:
            # The user is authenticated
            return Response({
                "authenticated": True,
                "user": str(request.user),  # Or any user-specific information you want to include
            })
        else:
            # The user is not authenticated; with IsAuthenticated, you would typically not get to this point,
            # as an unauthenticated request would be rejected before hitting the view logic.
            return Response({"authenticated": False}, status=401)