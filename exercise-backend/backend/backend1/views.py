from django.shortcuts import render
from rest_framework import viewsets,status
from .models import Exercise, User, SavedWorkout,PlannedWorkout, NowPlayingTrack, UserUploadWorkedouts
from .serializers import ExerciseSerializer, UserSerializer, SavedWorkoutSerializer,PlannedWorkoutSerializer, UserUploadWorkoutsSerializer, NowPlayingTrackSerializer
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authentication import get_authorization_header, TokenAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.pagination import CursorPagination
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from uuid import uuid4
from .utils.utils import send_otp, generate_otp, send_track_update
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
import requests
from .backends import AppleAuthenticationBackend
import logging
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync 
from django.db.models import Q


logger = logging.getLogger(__name__)

import jwt
import datetime
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from rest_framework.throttling import ScopedRateThrottle
from .serializers import PublicUserSerializer



class ExerciseCursorPagination(CursorPagination):
    page_size = 10  # Adjust as needed
    ordering = 'date_created'  # Ensure ordering by a unique, indexed field (e.g., timestamp)

class ExerciseListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ExerciseSerializer
    pagination_class = ExerciseCursorPagination

    def get_queryset(self):
        queryset = Exercise.objects.all()
        muscle = self.request.query_params.get('primaryMuscles')
        search = self.request.query_params.get('search', '').strip()
        if muscle:
            queryset = queryset.filter(primaryMuscles__icontains=muscle)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search) | Q(category__icontains=search) | Q(primaryMuscles__icontains=search))
        return queryset.order_by('date_created', 'id')


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(is_active=False)
        otp = generate_otp()
        cache.set(f'otp_{user.email}', otp, timeout=300)
        if not send_otp(user.email, otp):
            user.delete()
            cache.delete(f'otp_{user.email}')
            return Response({'error': 'Could not send verification email. Please try again.'}, status=503)
        return Response({'message': 'Account created. Verify OTP to activate.'}, status=201)


class VerifyOTPAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp'

    def post(self, request):
        try:
            email = request.data.get('email')
            otp = request.data.get('otp')
            
            if not email or not otp:
                raise ValidationError({'error': 'Email and OTP are required.'})
            
            cached_otp = cache.get(f'otp_{email}')
            if not cached_otp or cached_otp != otp:
                raise ValidationError({'otp': 'Invalid or expired OTP.'})            
            user = User.objects.get(email=email)
            if not user.is_active:  # Check if the user is inactive
                cache.delete(f'otp_{email}')
                user.is_active = True  # Activate the user
                user.save()
            else:
                return Response({'message': 'User is already activated.'})            
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token
            
            user_data = UserSerializer(user).data
            return Response({
                'message': 'Account successfully verified and activated.',
                'user': user_data,
                'refresh': str(refresh),
                'access': str(access),
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)
        except ValidationError as ve:
            return Response({'error': ve.detail}, status=400)
        except Exception as e:
            logger.error('Unexpected error occurred in VerifyOTPAPIView', exc_info=True)
            return Response({'error': str(e)}, status=500)
        
class LoginAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'
    permission_classes = [AllowAny]  # Allow any user to access this view

    def post(self, request):
        identifier = request.data.get('identifier') or request.data.get('username') or request.data.get('email')
        password = request.data.get('password')
        if not isinstance(identifier, str) or not identifier.strip():
            raise AuthenticationFailed('Invalid username, email, or password')
        # Reject ambiguous legacy records rather than selecting a different account.
        matches = list(User.objects.filter(Q(email__iexact=identifier.strip()) | Q(username=identifier.strip()))[:2])
        if len(matches) != 1 or not password or not matches[0].check_password(password) or not matches[0].is_active:
            raise AuthenticationFailed('Invalid username, email, or password')
        user = matches[0]

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        response = Response()

        response.data = {
            'refresh': str(refresh),
            'access': str(access),
        }

        return response

class UserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with transaction.atomic():
            user = User.objects.select_for_update().get(id=request.user.id)
            user.update_streak()
        return Response(UserSerializer(user).data)


class UserCursorPagination(CursorPagination):
    page_size = 10
    ordering = "date_joined"

class UserListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicUserSerializer
    pagination_class = UserCursorPagination

    def get_queryset(self):
        queryset = User.objects.filter(is_active=True, is_searchable=True, is_private=False).exclude(id=self.request.user.id)
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(username__istartswith=search)
        return queryset.order_by('date_joined', 'id')


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id, is_active=True)
        if user.id != request.user.id and (user.is_private or not user.is_searchable):
            return Response({'error': 'Profile is private.'}, status=404)
        return Response(PublicUserSerializer(user).data)


class EditUserView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            user = request.user
            serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "User information updated successfully", "user": serializer.data}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class UserSavedWorkoutsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        # Use select_related to fetch related Exercise objects efficiently
        saved_workouts = SavedWorkout.objects.filter(user=user).select_related('exercise')
        serializer = SavedWorkoutSerializer(saved_workouts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
class LogoutView(APIView):
    def post(self,request):
        response = Response()
        response.delete_cookie('jwt')
        response.data = {
            'message': 'successful'
        }
        return response

class UploadWorkOutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            user = request.user
            workout_data = request.data
            serializer = UserUploadWorkoutsSerializer(data=workout_data, context={'request': request})
            if serializer.is_valid():
                workout = serializer.save(user=user)
                return Response({"message": f'Workout with {workout.id} has been saved!'}, status=status.HTTP_201_CREATED)
            else:
                return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f'An error has occurred {e}')
            logger.debug(f'An error has occured {e}')
            return Response({"error": "An unexpected error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class UserUploadedWorkoutsCursorPagination(CursorPagination):
    page_size = 10
    ordering = 'date_created'

class GetUserUploadedWorkOutView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserUploadWorkoutsSerializer
    pagination_class = UserUploadedWorkoutsCursorPagination

    def get_queryset(self):
        if self.request.query_params.get('is_public', 'false').lower() == 'true':
            return UserUploadWorkedouts.objects.filter(is_public=True, user__is_private=False).order_by('date_created', 'id')
        return UserUploadWorkedouts.objects.filter(user=self.request.user).order_by('date_created', 'id')


class GetTrainerVerifiedWorkkouts(ListAPIView):
    authentication_classes = [IsAuthenticated]
    serializer_class = UserUploadWorkoutsSerializer
    pagination_class = UserUploadedWorkoutsCursorPagination

    def get_queryset(self):
        cursor = self.request.query_params.get('cursor', 'first_page')
        cache_key = f"trainer_verfied_workouts {cursor}"
        cached_workouts = cache.get(cache_key)
        if cached_workouts:
            return cached_workouts
        workouts = UserUploadWorkedouts.objects.filter(trainer_verified=True).order_by("-date_created")
        cache.set(cache_key)
        return workouts

class GetBodyPartWorkOutView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            bodyPart = request.data.get('bodyPart')
            exercises = Exercise.objects.all()
            if bodyPart:
                exercises = exercises.filter(primaryMuscles__overlap=bodyPart)
            serializer = ExerciseSerializer(exercises, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.debug(f'An internal error has occurred {e}')
            print(f'An internal error has occurred {e}')
            return Response({"error": f"f'An internal error has occurred {e}'"})

class SaveWorkOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        exercise_id = request.data.get('workout', {}).get('id')
        if not exercise_id:
            raise ValidationError({'error': 'Exercise ID is required.'})
        from rest_framework.serializers import UUIDField
        exercise_id = UUIDField().run_validation(exercise_id)
        exercise = get_object_or_404(Exercise, id=exercise_id)
        workout, created = SavedWorkout.objects.get_or_create(user=request.user, exercise=exercise)
        return Response({'workout': workout.id, 'created': created, 'message': 'Workout saved.' if created else 'Workout already saved.'}, status=201 if created else 200)


class UserPlannedWorkoutsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        workouts = PlannedWorkout.objects.filter(user=request.user).select_related('saved_workout__exercise', 'custom_workout')
        return Response(PlannedWorkoutSerializer(workouts, many=True).data)

    def post(self, request):
        workout = request.data.get('workout', {})
        exercise_id = workout.get('exercise', {}).get('id')
        from rest_framework.serializers import UUIDField
        exercise_id = UUIDField().run_validation(exercise_id)
        custom = UserUploadWorkedouts.objects.filter(id=exercise_id, user=request.user).first() if exercise_id else None
        saved = None if custom else get_object_or_404(SavedWorkout, exercise_id=exercise_id, user=request.user)
        serializer = PlannedWorkoutSerializer(data={
            'saved_workout': saved.id if saved else None,
            'custom_workout': str(custom.id) if custom else None,
            'day_of_the_week': workout.get('day'),
            'reps': workout.get('reps'),
            'sets': workout.get('sets', 1),
        })
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        with transaction.atomic():
            plan, created = PlannedWorkout.objects.get_or_create(
                user=request.user, saved_workout=saved, custom_workout=custom,
                day_of_the_week=values['day_of_the_week'],
                defaults={'reps': values['reps'], 'sets': values['sets']},
            )
        return Response(PlannedWorkoutSerializer(plan).data, status=201 if created else 200)


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

class SigninWIthApple(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            id_token = request.data.get('id_token')
            if not id_token:
                return Response({'error': 'Missing id token'}, status=400)
            
            backend = AppleAuthenticationBackend()
            user = backend.authenticate(request, id_token)
            if user:
                refresh = RefreshToken.for_user(user)
                access = refresh.access_token
                return Response({
                        'refresh': str(refresh),
                        'access': str(access),
                    }, status=200)
            else:
                return Response({"error": "Authentication failed"}, status=401)
        except Exception as e:
            print(f"An error has occured {e}")
            return Response({"error": "Internal server error"})
        
class RequestPasswordResetAPIView(APIView):
        permission_classes = [AllowAny]
        def post(self, request):
            email = request.data.get('email')        
            if not email:
                raise ValidationError({'email': 'This field is required'})
            try:
                user = User.objects.get(email=email)
                token_generator = PasswordResetTokenGenerator()
                token = token_generator.make_token(user)

                from urllib.parse import urlencode
                from django.urls import reverse
                reset_link = request.build_absolute_uri(reverse('password-reset-landing')) + '?' + urlencode({'token': token, 'email': email})
                email_subject = "Password Reset Request"
                email_body = f"""
                    <p>Click the link below to reset your password:</p>
                    <a href="{reset_link}">{reset_link}</a>
                """
                email = EmailMessage(
                    subject=email_subject,
                    body=email_body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[email],
                )
                email.content_subtype = "html"  # Set the email content to HTML
                email.send()
                return Response({'message': 'Password reset link sent to your email'})
            except User.DoesNotExist:
                raise ValidationError({'email': 'User with this email does not exist'})
            except Exception as e:
                print( f"There is an internal error {e}")
                return Response({'message': f"There is an internal error {e}"}, status=500)
            
class ResetPasswordAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        from django.core.exceptions import ValidationError as PasswordError
        user = get_object_or_404(User, email=request.data.get('email'))
        if not PasswordResetTokenGenerator().check_token(user, request.data.get('token')):
            raise ValidationError({'error': 'Invalid or expired reset link.'})
        password = request.data.get('new_password', '')
        try:
            validate_password(password, user)
        except PasswordError as error:
            raise ValidationError({'new_password': error.messages})
        user.set_password(password)
        user.save(update_fields=['password'])
        return Response({'message': 'Password has been reset successfully.'})


class TrackStreakView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        with transaction.atomic():
            user = User.objects.select_for_update().get(id=request.user.id)
            user.update_streak()
        return Response(UserSerializer(user).data)


class UpdateNowPlayingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            track_name = request.data.get('track_name')
            artist_name = request.data.get('artist_name')
            album_image_url = request.data.get('album_image_url')
            album_name = request.data.get('album_name')
            user = get_object_or_404(User, id=request.user.id) 
            send_track_update(user.id, track_name, artist_name, album_image_url)
            return Response({"message":"Track updated successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.debug(f'An error has occurred {e}')
            print(f'An error has occurred {e}')
            Response({"error": f"An error has occurred {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class NowPlayingForUserView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, user_id):
        try:
            user = get_object_or_404(User, id=user_id)
            track = NowPlayingTrack.objects.filter(user=user).order_by("-timestamp").first()
            if track:
                serializer = NowPlayingTrackSerializer(track)
                return Response(serializer.data,status=status.HTTP_200_OK)
            else:
                return Response({"message": "User is currently not playing any track"}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error":"User doesn't exist"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Internal server error {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class DeletePlannedWorkoutView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, planned_workout_id):
        planned_workout = get_object_or_404(PlannedWorkout, id=planned_workout_id, user=request.user)
        planned_workout.delete()
        return Response({"message": "Planned workout deleted successfully."}, status=status.HTTP_200_OK)

class DeleteSavedWorkoutView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, saved_workout_id):
        saved_workout = get_object_or_404(SavedWorkout, id=saved_workout_id, user=request.user)
        saved_workout.delete()
        return Response({"message": "Saved workout deleted successfully."}, status=status.HTTP_200_OK)    
class DeleteUserAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        request.user.delete()
        return Response(status=204)


class ReportIssueView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'reports'

    def post(self, request):
        report = request.data.get('reportObj', request.data)
        text = report.get('report_text', '').strip()
        if not text or len(text) > 5000:
            raise ValidationError({'error': 'Enter a report between 1 and 5000 characters.'})
        if not settings.REPORT_EMAIL:
            return Response({'error': 'Reporting is not configured.'}, status=503)
        send_mail('Exercise app report', f"Reporter: {request.user.id}\nType: {report.get('report_type', 'issue')}\nID: {report.get('reported_id', '')}\n{text}", settings.DEFAULT_FROM_EMAIL, [settings.REPORT_EMAIL], fail_silently=False)
        return Response({'message': 'Report sent successfully.'})


class DeleteUserUploadedWorkoutView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, workout_id):
        get_object_or_404(UserUploadWorkedouts, id=workout_id, user=request.user).delete()
        return Response(status=204)

class ChatUnavailableView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({'error': 'Exercise recommendations are planned for a later release. You can find and save exercises using Search.'}, status=503)

class ResendOTPAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp'

    def post(self, request):
        email = request.data.get('email')
        if not email:
            raise ValidationError({'email': 'Email is required.'})
        user = User.objects.filter(email=email, is_active=False).first()
        if user:
            otp = generate_otp()
            if not send_otp(email, otp):
                return Response({'error': 'Could not send verification email. Please try again.'}, status=503)
            cache.set(f'otp_{email}', otp, timeout=300)
        return Response({'message': 'If this account needs verification, a new code has been sent.'})
