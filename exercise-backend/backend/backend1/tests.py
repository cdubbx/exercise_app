from datetime import timedelta
from io import BytesIO
import tempfile
from unittest.mock import patch
from PIL import Image
from django.test import TestCase, override_settings
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Exercise, SavedWorkout, PlannedWorkout, UserUploadWorkedouts


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class CoreAppTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = self.make_user('first@example.com', 'first')
        self.other = self.make_user('other@example.com', 'other')
        self.exercise = Exercise.objects.create(name='Biceps curl', primaryMuscles=['biceps'])
        self.client = APIClient(); self.client.force_authenticate(self.user)

    def make_user(self, email, username):
        user = User(email=email, username=username)
        user.set_password('Training-plan-2026!'); user.save()
        return user

    def save(self):
        return self.client.post('/api/saveWorkOuts', {'workout': {'id': str(self.exercise.id)}}, format='json')

    def plan(self, exercise=None, **changes):
        workout = {'exercise': {'id': str((exercise or self.exercise).id)}, 'day': 'Monday', 'reps': 10, 'sets': 3}
        workout.update(changes)
        return self.client.post('/api/plannedWorkouts/', {'workout': workout}, format='json')

    def test_register_verify_and_inactive_login(self):
        self.client.force_authenticate(None)
        response = self.client.post('/api/register/', {'email': 'new@example.com', 'username': 'new', 'password': 'Training-plan-2026!'}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        otp = cache.get('otp_new@example.com')
        response = self.client.post('/api/login/', {'email': 'new@example.com', 'password': 'Training-plan-2026!'}, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.client.post('/api/verify-otp/', {'email': 'new@example.com', 'otp': 'wrong'}, format='json').status_code, 400)
        response = self.client.post('/api/verify-otp/', {'email': 'new@example.com', 'otp': otp}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn('access', response.data); self.assertIsNone(cache.get('otp_new@example.com'))

    @patch('backend1.views.send_otp', return_value=False)
    def test_email_failure_can_retry_registration(self, send):
        response = self.client.post('/api/register/', {'email': 'new@example.com', 'password': 'Training-plan-2026!'}, format='json')
        self.assertEqual(response.status_code, 503)
        self.assertFalse(User.objects.filter(email='new@example.com').exists())

    def test_standard_jwt_refresh_contract(self):
        self.client.force_authenticate(None)
        response = self.client.post('/api/token/refresh/', {'refresh': str(RefreshToken.for_user(self.user))}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])
        self.assertEqual(self.client.get('/api/user/').status_code, 200)

    def test_catalog_cursor_search_and_no_embeddings(self):
        for i in range(12): Exercise.objects.create(name=f'Curl {i}', primaryMuscles=['biceps'])
        first = self.client.get('/api/exercises/?search=curl&primaryMuscles=biceps')
        self.assertEqual(len(first.data['results']), 10)
        self.assertNotIn('embedding', first.data['results'][0])
        from urllib.parse import urlsplit
        url = urlsplit(first.data['next']); second = self.client.get(url.path + '?' + url.query)
        ids = [item['id'] for item in first.data['results'] + second.data['results']]
        self.assertEqual(len(ids), 13); self.assertEqual(len(ids), len(set(ids)))

    def test_duplicate_saves_return_success_without_duplication(self):
        self.assertEqual(self.save().status_code, 201)
        again = self.save(); self.assertEqual(again.status_code, 200)
        self.assertFalse(again.data['created']); self.assertEqual(SavedWorkout.objects.count(), 1)

    def test_duplicate_plans_keep_one_entry_and_return_sets_reps(self):
        self.save(); first = self.plan(); second = self.plan()
        self.assertEqual(first.status_code, 201, first.data); self.assertEqual(second.status_code, 200, second.data)
        self.assertEqual(first.data['id'], second.data['id']); self.assertEqual(PlannedWorkout.objects.count(), 1)
        result = self.client.get('/api/plannedWorkouts/').data[0]
        self.assertEqual(result['sets'], 3); self.assertEqual(result['reps'], 10)
        self.assertEqual(result['saved_workout_details']['exercise']['name'], self.exercise.name)

    def test_invalid_plan_inputs(self):
        self.save()
        for changes in [{'sets': 0}, {'reps': 0}, {'sets': 101}, {'reps': 'abc'}, {'day': 'Yesterday'}]:
            with self.subTest(changes=changes): self.assertEqual(self.plan(**changes).status_code, 400)
        self.assertFalse(PlannedWorkout.objects.exists())

    def test_own_custom_workout_can_be_planned(self):
        custom = UserUploadWorkedouts.objects.create(user=self.user, name='My curl')
        response = self.plan(custom); self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['exercise']['name'], 'My curl'); self.assertIsNone(response.data['saved_workout'])

    def test_other_custom_workout_cannot_be_planned(self):
        custom = UserUploadWorkedouts.objects.create(user=self.other, name='Private curl')
        self.assertEqual(self.plan(custom).status_code, 404)

    def test_lists_are_user_scoped(self):
        self.save(); self.plan(); self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get('/api/userSavedWorkouts/').data, [])
        self.assertEqual(self.client.get('/api/plannedWorkouts/').data, [])

    def test_delete_checks_ownership_and_cascades(self):
        saved = self.save().data['workout']; plan = self.plan().data['id']
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.delete(f'/api/delete-saved-workout/{saved}/').status_code, 404)
        self.assertEqual(self.client.delete(f'/api/delete-planned-workout/{plan}/').status_code, 404)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.delete(f'/api/delete-saved-workout/{saved}/').status_code, 200)
        self.assertFalse(PlannedWorkout.objects.exists())

    def test_public_feed_does_not_leak_private_uploads(self):
        UserUploadWorkedouts.objects.create(user=self.user, name='Public', is_public=True)
        UserUploadWorkedouts.objects.create(user=self.user, name='Secret', is_public=False)
        self.other.is_private = True; self.other.save()
        UserUploadWorkedouts.objects.create(user=self.other, name='Private profile', is_public=True)
        for viewer in [self.user, self.other]:
            self.client.force_authenticate(viewer)
            response = self.client.get('/api/user-upload-workouts/?is_public=true')
            self.assertEqual([w['name'] for w in response.data['results']], ['Public'])

    def test_profile_updates_and_readonly_streak(self):
        response = self.client.post('/api/user/update/', {'username': 'renamed', 'is_private': True, 'is_searchable': True, 'streak': 900}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.user.refresh_from_db(); self.assertTrue(self.user.is_private)
        self.assertEqual(self.user.username, 'renamed'); self.assertEqual(self.user.streak, 0)
        self.assertNotIn('password', response.data['user'])

    def test_public_profiles_use_uuid_hide_contact_data_and_obey_privacy(self):
        self.other.is_searchable = True; self.other.save()
        response = self.client.get(f'/api/users/{self.other.id}/')
        self.assertEqual(response.status_code, 200)
        for field in ['email', 'phone_number', 'weight', 'height', 'goal_weight']: self.assertNotIn(field, response.data)
        self.other.is_private = True; self.other.save()
        self.assertEqual(self.client.get(f'/api/users/{self.other.id}/').status_code, 404)
        self.assertEqual(self.client.get('/api/users/').data['results'], [])

    def test_streak_once_per_day_and_reset_after_gap(self):
        self.user.last_active = timezone.localdate() - timedelta(days=1); self.user.streak = 4; self.user.save()
        self.assertEqual(self.client.get('/api/user/').data['streak'], 5)
        self.assertEqual(self.client.post('/api/streak/').data['streak'], 5)
        self.user.refresh_from_db(); self.user.last_active -= timedelta(days=3); self.user.save()
        self.assertEqual(self.client.post('/api/streak/').data['streak'], 1)

    def test_password_reset_bad_token_then_success_and_token_consumed(self):
        payload = {'email': self.user.email, 'token': 'bad', 'new_password': 'New-training-2026!'}
        self.assertEqual(self.client.post('/api/reset-password/', payload, format='json').status_code, 400)
        payload['token'] = PasswordResetTokenGenerator().make_token(self.user)
        response = self.client.post('/api/reset-password/', payload, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.user.refresh_from_db(); self.assertTrue(self.user.check_password(payload['new_password']))
        self.assertEqual(self.client.post('/api/reset-password/', payload, format='json').status_code, 400)

    def test_valid_image_upload_then_profile_save(self):
        image = BytesIO(); Image.new('RGB', (10, 10)).save(image, format='PNG')
        with tempfile.TemporaryDirectory() as media, override_settings(MEDIA_ROOT=media, AWS_STORAGE_BUCKET_NAME=''):
            response = self.client.post('/api/uploads/', {'path': 'profile', 'file': SimpleUploadedFile('avatar.png', image.getvalue(), content_type='image/png')}, format='multipart')
            self.assertEqual(response.status_code, 201, response.data); self.assertIn(str(self.user.id), response.data['url'])
            self.assertEqual(self.client.post('/api/user/update/', {'image_url': response.data['url']}, format='json').status_code, 200)
            self.user.refresh_from_db(); self.assertEqual(self.user.image_url, response.data['url'])

    def test_fake_image_rejected(self):
        response = self.client.post('/api/uploads/', {'path': 'profile', 'file': SimpleUploadedFile('fake.png', b'not an image', content_type='image/png')}, format='multipart')
        self.assertEqual(response.status_code, 400)

    def test_upload_cannot_verify_trainer_or_set_owner(self):
        response = self.client.post('/api/user-upload-workout/', {'name': 'Custom', 'trainer_verified': True, 'user': str(self.other.id)}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        workout = UserUploadWorkedouts.objects.get(); self.assertEqual(workout.user, self.user); self.assertFalse(workout.trainer_verified)

    @override_settings(REPORT_EMAIL='reports@example.com')
    def test_report_mobile_payload(self):
        response = self.client.post('/api/report/', {'reportObj': {'report_type': 'exercise', 'reported_id': str(self.exercise.id), 'report_text': 'Wrong instructions'}}, format='json')
        self.assertEqual(response.status_code, 200)
        from django.core import mail
        self.assertEqual(len(mail.outbox), 1)

    def test_account_delete_cascades(self):
        self.save(); self.plan()
        self.assertEqual(self.client.delete('/api/user/delete/').status_code, 204)
        self.assertFalse(User.objects.filter(id=self.user.id).exists()); self.assertFalse(SavedWorkout.objects.exists()); self.assertFalse(PlannedWorkout.objects.exists())

    def test_anonymous_writes_rejected(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.save().status_code, 401); self.assertEqual(self.client.post('/api/uploads/', {}).status_code, 401)

    def test_resend_otp_replaces_expired_code(self):
        self.user.is_active = False; self.user.save()
        self.client.force_authenticate(None)
        response = self.client.post('/api/resend-otp/', {'email': self.user.email}, format='json')
        self.assertEqual(response.status_code, 200)
        otp = cache.get(f'otp_{self.user.email}')
        self.assertIsNotNone(otp)
        response = self.client.post('/api/verify-otp/', {'email': self.user.email, 'otp': otp}, format='json')
        self.assertEqual(response.status_code, 200)

    def test_invalid_uuid_is_a_validation_error(self):
        self.assertEqual(self.client.post('/api/saveWorkOuts', {'workout': {'id': 'invalid'}}, format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/plannedWorkouts/', {'workout': {'exercise': {'id': 'invalid'}}}, format='json').status_code, 400)

    def test_historical_free_text_reps_remain_readable(self):
        saved = SavedWorkout.objects.create(user=self.user, exercise=self.exercise)
        PlannedWorkout.objects.create(user=self.user, saved_workout=saved, day_of_the_week='Monday', reps='10 each side')
        response = self.client.get('/api/plannedWorkouts/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['reps'], '10 each side')

    def test_users_search_filters_before_pagination(self):
        self.other.is_searchable = True; self.other.save()
        self.assertEqual(len(self.client.get('/api/users/?search=oth').data['results']), 1)
        self.assertEqual(self.client.get('/api/users/?search=no-match').data['results'], [])
