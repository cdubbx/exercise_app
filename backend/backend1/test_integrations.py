from datetime import timedelta
from io import BytesIO
from urllib.parse import parse_qs, urlsplit
from unittest.mock import Mock, patch

import requests
from cryptography.fernet import Fernet
from botocore.exceptions import ClientError
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient
from .models import SpotifyConnection, User, UserUploadWorkedouts
from .spotify import SCOPES, cipher


@override_settings(SPOTIFY_ENABLED=True, SPOTIFY_CLIENT_ID='test-client', SPOTIFY_CLIENT_SECRET='server-secret',
                   SPOTIFY_REDIRECT_URI='https://api.example.com/api/spotify/callback/',
                   SPOTIFY_TOKEN_ENCRYPTION_KEY=Fernet.generate_key().decode())
class SpotifyTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create(email='one@example.com', username='one')
        self.other = User.objects.create(email='two@example.com', username='two')
        self.client = APIClient(); self.client.force_authenticate(self.user)

    def begin(self):
        response = self.client.post('/api/spotify/connect/')
        self.assertEqual(response.status_code, 200, response.data)
        return parse_qs(urlsplit(response.data['url']).query)

    def connected(self, expired=False):
        return SpotifyConnection.objects.create(user=self.user, access_token=cipher().encrypt(b'access').decode(),
                refresh_token=cipher().encrypt(b'refresh').decode(), expires_at=timezone.now() + timedelta(seconds=-1 if expired else 3600))

    def test_connect_requires_auth_and_state_is_opaque_and_pkce_bound(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post('/api/spotify/connect/').status_code, 401)
        self.client.force_authenticate(self.user)
        params = self.begin(); connection = SpotifyConnection.objects.get(user=self.user)
        self.assertEqual(params['scope'], [SCOPES]); self.assertEqual(params['code_challenge_method'], ['S256'])
        self.assertNotEqual(params['state'][0], connection.pending_state)
        self.assertNotIn('server-secret', str(params))

    @patch('backend1.spotify.requests.post')
    def test_callback_stores_encrypted_tokens_never_returns_tokens_and_cannot_replay(self, post):
        state = self.begin()['state'][0]
        post.return_value = Mock(ok=True, status_code=200, json=lambda: {'access_token': 'secret-access', 'refresh_token': 'secret-refresh', 'expires_in': 3600, 'scope': SCOPES})
        self.client.force_authenticate(None)
        response = self.client.get('/api/spotify/callback/', {'state': state, 'code': 'test-code'})
        self.assertEqual(response.status_code, 200); self.assertNotIn(b'secret-access', response.content)
        connection = SpotifyConnection.objects.get(); self.assertNotEqual(connection.access_token, 'secret-access')
        self.assertEqual(cipher().decrypt(connection.refresh_token.encode()), b'secret-refresh')
        self.assertEqual(post.call_args.kwargs['data']['redirect_uri'], 'https://api.example.com/api/spotify/callback/')
        self.assertEqual(self.client.get('/api/spotify/callback/', {'state': state, 'code': 'test-code'}).status_code, 400)
        self.assertEqual(post.call_count, 1)

    @patch('backend1.spotify.requests.post')
    def test_forged_expired_or_denied_callback_never_exchanges_tokens(self, post):
        state = self.begin()['state'][0]
        self.assertEqual(self.client.get('/api/spotify/callback/', {'state': 'wrong', 'code': 'code'}).status_code, 400)
        self.assertEqual(self.client.get('/api/spotify/callback/', {'state': state, 'error': 'access_denied'}).status_code, 200)
        state = self.begin()['state'][0]
        SpotifyConnection.objects.update(pending_expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.client.get('/api/spotify/callback/', {'state': state, 'code': 'code'}).status_code, 400)
        post.assert_not_called()

    @patch('backend1.spotify.requests.post')
    def test_failed_exchange_consumes_state_and_can_restart(self, post):
        state = self.begin()['state'][0]
        post.return_value = Mock(ok=False, status_code=400)
        self.assertEqual(self.client.get('/api/spotify/callback/', {'state': state, 'code': 'bad'}).status_code, 200)
        self.assertEqual(self.client.get('/api/spotify/callback/', {'state': state, 'code': 'bad'}).status_code, 400)
        self.assertNotEqual(self.begin()['state'][0], state)

    @patch('backend1.spotify.requests.request')
    def test_player_reads_only_current_account_and_handles_no_content(self, request):
        self.connected(); request.return_value = Mock(ok=True, status_code=204)
        response = self.client.get('/api/spotify/player/')
        self.assertEqual(response.data['track'], None); self.assertFalse(response.data['is_playing'])
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get('/api/spotify/player/').status_code, 400)
        self.assertEqual(request.call_count, 1)

    @patch('backend1.spotify.requests.request')
    @patch('backend1.spotify.requests.post')
    def test_expired_token_refresh_is_server_side_and_preserves_refresh_token(self, post, request):
        connection = self.connected(expired=True)
        post.return_value = Mock(ok=True, status_code=200, json=lambda: {'access_token': 'renewed', 'expires_in': 3600})
        request.return_value = Mock(ok=True, status_code=204)
        self.assertEqual(self.client.post('/api/spotify/player/', {'action': 'pause'}).status_code, 204)
        self.assertEqual(request.call_args.args[0:2], ('PUT', 'https://api.spotify.com/v1/me/player/pause'))
        self.assertEqual(request.call_args.kwargs['headers']['Authorization'], 'Bearer renewed')
        connection.refresh_from_db(); self.assertEqual(cipher().decrypt(connection.refresh_token.encode()), b'refresh')

    @patch('backend1.spotify.requests.request')
    def test_skip_controls_and_provider_errors(self, request):
        self.connected(); request.return_value = Mock(ok=True, status_code=204)
        for action in ('next', 'previous'):
            self.assertEqual(self.client.post('/api/spotify/player/', {'action': action}).status_code, 204)
            self.assertEqual(request.call_args.args[:2], ('POST', 'https://api.spotify.com/v1/me/player/' + action))
        for status, expected in [(403, 400), (404, 400), (429, 429), (500, 503)]:
            request.return_value = Mock(ok=False, status_code=status)
            self.assertEqual(self.client.post('/api/spotify/player/', {'action': 'play'}).status_code, expected)
        self.assertEqual(self.client.post('/api/spotify/player/', {'action': 'delete'}).status_code, 400)

    @patch('backend1.spotify.requests.request')
    def test_playback_control_accepts_http_200_without_parsing_body(self, request):
        self.connected()
        response = Mock(ok=True, status_code=200, headers={})
        response.json.side_effect = AssertionError('control response body should not be parsed')
        request.return_value = response

        result = self.client.post('/api/spotify/player/', {'action': 'previous'})

        self.assertEqual(result.status_code, 204)
        response.json.assert_not_called()

    @patch('backend1.spotify.requests.request')
    def test_spotify_provider_failures_log_status_without_credentials_or_body(self, request):
        self.connected(); request.return_value = Mock(ok=False, status_code=503, headers={'Retry-After': '2'}, text='sensitive provider body')
        with self.assertLogs('backend1.spotify', level='WARNING') as captured:
            response = self.client.post('/api/spotify/player/', {'action': 'pause'})
        self.assertEqual(response.status_code, 503)
        logs = '\n'.join(captured.output)
        self.assertIn('spotify_playback_provider_error', logs)
        self.assertIn('status_code=503', logs)
        self.assertIn('action=pause', logs)
        self.assertNotIn('sensitive provider body', logs)
        self.assertNotIn('Bearer access', logs)

    @patch('backend1.spotify.requests.request')
    def test_spotify_network_failures_log_exception_type_only(self, request):
        self.connected(); request.side_effect = requests.Timeout('secret-bearing request URL')
        with self.assertLogs('backend1.spotify', level='WARNING') as captured:
            response = self.client.post('/api/spotify/player/', {'action': 'pause'})
        self.assertEqual(response.status_code, 503)
        logs = '\n'.join(captured.output)
        self.assertIn('spotify_playback_network_error', logs)
        self.assertIn('exception_type=Timeout', logs)
        self.assertNotIn('secret-bearing request URL', logs)

    @patch('backend1.spotify.requests.request')
    @patch('backend1.spotify.requests.post')
    def test_unauthorized_after_refresh_clears_connection(self, post, request):
        self.connected()
        post.return_value = Mock(ok=True, status_code=200, json=lambda: {'access_token': 'renewed', 'expires_in': 3600})
        request.return_value = Mock(ok=False, status_code=401)
        self.assertEqual(self.client.get('/api/spotify/player/').status_code, 400)
        self.assertFalse(self.client.get('/api/spotify/').data['connected']); self.assertEqual(request.call_count, 2)

    @patch('backend1.spotify.requests.request')
    def test_track_display_and_device_restrictions_are_preserved(self, request):
        self.connected()
        request.return_value = Mock(ok=True, status_code=200, json=lambda: {
            'is_playing': True, 'currently_playing_type': 'track', 'device': {'id': 'active'},
            'item': {'name': 'Track', 'artists': [{'name': 'Artist'}], 'album': {'images': [{'url': 'https://image.example/art'}]}, 'external_urls': {'spotify': 'https://open.spotify.com/track/test'}},
            'actions': {'disallows': {'skipping_next': True}}})
        response = self.client.get('/api/spotify/player/')
        self.assertEqual(response.data['track']['artists'], 'Artist')
        self.assertTrue(response.data['device_active']); self.assertTrue(response.data['disallows']['skipping_next'])
        self.assertNotIn('access_token', response.data)

    @patch('backend1.spotify.requests.post')
    def test_revoked_refresh_token_persists_disconnection(self, post):
        self.connected(expired=True); post.return_value = Mock(ok=False, status_code=400)
        self.assertEqual(self.client.get('/api/spotify/player/').status_code, 400)
        self.assertFalse(self.client.get('/api/spotify/').data['connected'])

    def test_disconnect_is_account_scoped_and_cancels_pending_oauth(self):
        self.connected(); state = self.begin()['state'][0]
        self.assertEqual(self.client.delete('/api/spotify/').status_code, 204)
        self.assertFalse(SpotifyConnection.objects.exists())
        self.assertEqual(self.client.get('/api/spotify/callback/', {'state': state, 'code': 'code'}).status_code, 400)

    def test_legacy_token_endpoints_are_closed_and_configuration_is_explicit(self):
        self.assertEqual(self.client.post('/api/token/swap/', {'code': 'code'}).status_code, 410)
        with override_settings(SPOTIFY_ENABLED=False):
            self.assertFalse(self.client.get('/api/spotify/').data['configured'])
            self.assertEqual(self.client.post('/api/spotify/connect/').status_code, 503)
        with override_settings(SPOTIFY_REDIRECT_URI='http://production.example.com/callback'):
            self.assertFalse(self.client.get('/api/spotify/').data['configured'])


@override_settings(AWS_STORAGE_BUCKET_NAME='test-images', AWS_S3_REGION_NAME='us-east-2')
class S3UploadTests(TestCase):
    def setUp(self):
        cache.clear(); self.user = User.objects.create(email='media@example.com', username='media')
        self.client = APIClient(); self.client.force_authenticate(self.user)

    def photo(self):
        output = BytesIO(); image = Image.new('RGB', (12, 12)); exif = Image.Exif(); exif[270] = 'private metadata'
        image.save(output, format='JPEG', exif=exif)
        return SimpleUploadedFile('photo.jpg', output.getvalue(), content_type='image/jpeg')

    @patch('backend1.media.s3_client')
    @patch('backend1.uploads.s3_client')
    def test_private_upload_metadata_removed_and_signed_url_saved_canonically(self, upload, read):
        signed = 'https://test-images.s3.us-east-2.amazonaws.com/profile-images/' + str(self.user.id) + '/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg?X-Amz-Signature=temporary'
        read.return_value.generate_presigned_url.return_value = signed
        response = self.client.post('/api/uploads/', {'path': 'profile', 'file': self.photo()}, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        arguments = upload.return_value.put_object.call_args.kwargs
        self.assertNotIn('ACL', arguments); self.assertIn(str(self.user.id), arguments['Key'])
        self.assertFalse(Image.open(BytesIO(arguments['Body'])).getexif())
        saved = self.client.post('/api/user/update/', {'image_url': signed}, format='json')
        self.assertEqual(saved.status_code, 200, saved.data)
        self.user.refresh_from_db(); self.assertNotIn('?', self.user.image_url)
        read.return_value.generate_presigned_url.return_value = 'https://signed.example/new-link'
        self.assertEqual(self.client.get('/api/user/').data['image_url'], 'https://signed.example/new-link')

    @patch('backend1.uploads.s3_client')
    def test_storage_failure_has_retryable_error_and_no_disk_fallback(self, upload):
        upload.return_value.put_object.side_effect = ClientError({'Error': {'Code': 'AccessDenied', 'Message': 'internal details'}}, 'PutObject')
        response = self.client.post('/api/uploads/', {'path': 'exercises', 'file': self.photo()}, format='multipart')
        self.assertEqual(response.status_code, 503); self.assertNotIn('internal details', str(response.data))

    @override_settings(AWS_STORAGE_BUCKET_NAME='', DEBUG=False)
    def test_production_cannot_silently_store_images_on_ephemeral_disk(self):
        self.assertEqual(self.client.post('/api/uploads/', {'path': 'profile', 'file': self.photo()}, format='multipart').status_code, 503)

    def test_cannot_claim_or_sign_another_users_s3_object(self):
        foreign = 'https://test-images.s3.us-east-2.amazonaws.com/profile-images/other-user/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg'
        self.assertEqual(self.client.post('/api/user/update/', {'image_url': foreign}, format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/user-upload-workout/', {'name': 'Private', 'img_url': [foreign]}, format='json').status_code, 400)
        self.assertFalse(UserUploadWorkedouts.objects.exists())
