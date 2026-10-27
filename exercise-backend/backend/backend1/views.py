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
import os
import hashlib
import json


logger = logging.getLogger(__name__)


def resolve_catalog_exercise(name):
    """Resolve catalog labels and common natural-language names to canonical exercises."""
    normalized_name = ''.join(character for character in name.casefold() if character.isalnum())
    aliases = {
        'bentoverrow': 'Bent Over Barbell Row',
        'bentoverrows': 'Bent Over Barbell Row',
        'pullup': 'Pullups',
        'pullups': 'Pullups',
        'chinup': 'Chin-Up',
        'chinups': 'Chin-Up',
        'pushup': 'Pushups',
        'pushups': 'Pushups',
        'jumpingjack': 'Star Jump',
        'jumpingjacks': 'Star Jump',
    }
    candidates = [name.strip()]
    candidates.extend(part.strip() for part in name.split('/') if part.strip())
    alias = aliases.get(normalized_name)
    if alias:
        candidates.insert(0, alias)
    for candidate in list(candidates):
        last_word = candidate.rsplit(' ', 1)
        if last_word[-1].endswith('s') and not last_word[-1].endswith('ss'):
            candidates.append(' '.join(last_word[:-1] + [last_word[-1][:-1]]))
    for candidate in candidates:
        exercise = Exercise.objects.filter(name__iexact=candidate).first()
        if exercise:
            return exercise
    return None

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
        workouts = request.data.get('workouts')
        is_batch = isinstance(workouts, list)
        if is_batch and (not workouts or len(workouts) > 8):
            raise ValidationError({'workouts': 'Add between 1 and 8 exercises at a time.'})
        if not is_batch:
            workouts = [request.data.get('workout', {})]
        plans = []
        any_created = False
        with transaction.atomic():
            for workout in workouts:
                if not isinstance(workout, dict):
                    raise ValidationError({'workouts': 'Each planned exercise must be an object.'})
                plan, created = self._create_planned_workout(request, workout)
                plans.append(plan)
                any_created = any_created or created
        if is_batch:
            return Response(PlannedWorkoutSerializer(plans, many=True).data, status=201 if any_created else 200)
        return Response(PlannedWorkoutSerializer(plans[0]).data, status=201 if any_created else 200)

    def _create_planned_workout(self, request, workout):
        exercise_id = workout.get('exercise', {}).get('id')
        from rest_framework.serializers import UUIDField
        exercise_id = UUIDField().run_validation(exercise_id)
        custom = UserUploadWorkedouts.objects.filter(id=exercise_id, user=request.user).first() if exercise_id else None
        if custom:
            saved = None
        else:
            exercise = get_object_or_404(Exercise, id=exercise_id)
            saved, _ = SavedWorkout.objects.get_or_create(user=request.user, exercise=exercise)
        serializer = PlannedWorkoutSerializer(data={
            'saved_workout': saved.id if saved else None,
            'custom_workout': str(custom.id) if custom else None,
            'day_of_the_week': workout.get('day'),
            'time_of_day': workout.get('time_of_day', 'Anytime'),
            'reps': workout.get('reps'),
            'sets': workout.get('sets', 1),
        })
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        return PlannedWorkout.objects.get_or_create(
            user=request.user, saved_workout=saved, custom_workout=custom,
            day_of_the_week=values['day_of_the_week'],
            time_of_day=values['time_of_day'],
            defaults={'reps': values['reps'], 'sets': values['sets']},
        )


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

class ExerciseChatView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'chat'

    def post(self, request):
        query = request.data.get('query') if isinstance(request.data, dict) else None
        if not isinstance(query, str) or not query.strip():
            raise ValidationError({'query': 'Enter a question for the exercise coach.'})
        query = query.strip()
        if len(query) > 2000:
            raise ValidationError({'query': 'Keep your question under 2000 characters.'})

        conversation = request.data.get('conversation', [])
        if not isinstance(conversation, list):
            raise ValidationError({'conversation': 'Conversation history must be a list.'})
        history = []
        for message in conversation[-12:]:
            if not isinstance(message, dict) or message.get('role') not in {'user', 'assistant'}:
                raise ValidationError({'conversation': 'Conversation messages must be from the user or assistant.'})
            content = message.get('content')
            if not isinstance(content, str) or not content.strip() or len(content) > 2000:
                raise ValidationError({'conversation': 'Each conversation message must contain 1 to 2000 characters.'})
            history.append({'role': message['role'], 'content': content.strip()})

        api_key = os.getenv('OPENAI_API_KEY', '').strip()
        if not api_key:
            return Response({'error': 'Exercise chat is not configured yet.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        payload = {
            'model': os.getenv('OPENAI_MODEL', 'gpt-4.1-mini'),
            'instructions': (
                'You are Exercise Plus, a concise and supportive exercise coach. '
                'Give practical, general fitness guidance. Ask a brief clarifying question when needed. '
                'Do not diagnose injuries or medical conditions, prescribe treatment, or encourage training through pain. '
                'For pain, injury, or medical concerns, advise the user to stop and consult a qualified clinician. '
                'Keep workout suggestions beginner-aware and remind users to use safe form and suitable loads. '
                'Format replies for a phone screen using short paragraphs, Markdown headings when useful, '
                '**bold labels**, and bullets or numbered steps. Never use tables or HTML.'
            ),
            'input': history + [{'role': 'user', 'content': query}],
            'tools': [{
                'type': 'function',
                'name': 'propose_calendar_workout',
                'description': (
                    'Propose adding a complete set of existing exercises to one time slot on a weekday in the user’s weekly workout calendar. '
                    'Use only when the user clearly asks to schedule or add a workout. '
                    'Do not claim it was added; the user must confirm the proposal in the app. '
                    'Use the time of day requested by the user; choose Anytime when they do not specify one. '
                    'Include the exercises in the requested plan, using catalog names. Omit warm-ups or advice that are not catalog exercises. '
                    'Ask a question instead if the weekday or plan is unclear.'
                ),
                'strict': True,
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'day': {'type': 'string', 'enum': [label for value, label in PlannedWorkout.DAYS_OF_WEEK]},
                        'time_of_day': {'type': 'string', 'enum': [label for value, label in PlannedWorkout.TIMES_OF_DAY]},
                        'workouts': {
                            'type': 'array', 'minItems': 1, 'maxItems': 8,
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'exercise_name': {'type': 'string'},
                                    'reps': {'type': 'integer', 'minimum': 1, 'maximum': 1000},
                                    'sets': {'type': 'integer', 'minimum': 1, 'maximum': 100},
                                },
                                'required': ['exercise_name', 'reps', 'sets'],
                                'additionalProperties': False,
                            },
                        },
                    },
                    'required': ['day', 'time_of_day', 'workouts'],
                    'additionalProperties': False,
                },
            }],
            'tool_choice': 'auto',
            'parallel_tool_calls': False,
            'prompt_cache_key': 'exercise-plus-user-' + hashlib.sha256(str(request.user.pk).encode('utf-8')).hexdigest()[:24],
            'max_output_tokens': 500,
            'store': False,
        }
        try:
            upstream = requests.post(
                'https://api.openai.com/v1/responses',
                headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
                json=payload,
                timeout=(5, 35),
            )
        except requests.RequestException:
            logger.exception('Exercise chat request failed before receiving a response')
            return Response({'error': 'Exercise chat could not reach its service. Please try again.'}, status=503)

        if upstream.status_code >= 400:
            logger.warning('Exercise chat provider returned HTTP %s', upstream.status_code)
            try:
                provider_error = upstream.json().get('error', {})
            except (ValueError, AttributeError):
                provider_error = {}
            if provider_error.get('code') in {'insufficient_quota', 'credit_balance_exhausted', 'billing_hard_limit_reached'}:
                return Response(
                    {'error': 'Exercise chat needs available OpenAI API credits. Please try again later.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            return Response({'error': 'Exercise chat is temporarily unavailable. Please try again.'}, status=503)

        try:
            result = upstream.json()
            usage = result.get('usage', {})
            input_details = usage.get('input_tokens_details', {}) if isinstance(usage, dict) else {}
            if isinstance(input_details, dict):
                logger.info(
                    'Exercise chat token usage input=%s cached_input=%s',
                    usage.get('input_tokens'), input_details.get('cached_tokens', 0),
                )
            answer = '\n'.join(
                part.get('text', '')
                for item in result.get('output', [])
                if item.get('type') == 'message'
                for part in item.get('content', [])
                if part.get('type') == 'output_text' and isinstance(part.get('text'), str)
            ).strip()
            calendar_action = None
            for item in result.get('output', []):
                if item.get('type') != 'function_call' or item.get('name') != 'propose_calendar_workout':
                    continue
                try:
                    proposal = json.loads(item.get('arguments', '{}'))
                    day = proposal.get('day')
                    time_of_day = proposal.get('time_of_day', 'Anytime')
                    proposed_workouts = proposal.get('workouts')
                    if (day not in dict(PlannedWorkout.DAYS_OF_WEEK)
                            or time_of_day not in dict(PlannedWorkout.TIMES_OF_DAY)
                            or not isinstance(proposed_workouts, list)
                            or not 1 <= len(proposed_workouts) <= 8):
                        continue
                    resolved_workouts = []
                    missing_exercise = None
                    for proposed in proposed_workouts:
                        if (not isinstance(proposed, dict)
                                or not isinstance(proposed.get('exercise_name'), str)
                                or not isinstance(proposed.get('reps'), int)
                                or not isinstance(proposed.get('sets'), int)):
                            missing_exercise = 'an invalid exercise'
                            break
                        exercise = resolve_catalog_exercise(proposed['exercise_name'])
                        if not exercise:
                            missing_exercise = proposed['exercise_name']
                            break
                        resolved_workouts.append({
                            'exercise': {'id': str(exercise.id), 'name': exercise.name},
                            'reps': proposed['reps'],
                            'sets': proposed['sets'],
                        })
                    if missing_exercise:
                        answer = answer or f"I couldn't match “{missing_exercise}” to an exercise in the library, so I haven't added this plan. Try another exercise name."
                    else:
                        calendar_action = {
                            'day': day,
                            'time_of_day': time_of_day,
                            'workouts': resolved_workouts,
                        }
                        answer = f'I prepared this {time_of_day.lower()} workout plan for {day}. Review the exercises below, then tap Add to calendar to save it.'
                except (TypeError, ValueError, AttributeError):
                    logger.warning('Exercise chat returned invalid calendar action arguments')
                break
        except (ValueError, AttributeError, TypeError):
            answer = ''
            calendar_action = None
        if not answer:
            logger.warning('Exercise chat provider returned no text output')
            return Response({'error': 'Exercise chat could not create a reply. Please try again.'}, status=503)
        return Response({'gpt_response': answer, 'exercises': [], 'calendar_action': calendar_action})

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
