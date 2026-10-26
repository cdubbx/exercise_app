"""Account-bound Spotify OAuth and remote controls. Never return provider tokens."""
import base64
import hashlib
import secrets
from datetime import timedelta
from urllib.parse import urlencode, urlsplit

import requests
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from .models import SpotifyConnection

SCOPES = 'user-read-playback-state user-modify-playback-state'


class SpotifyError(APIException):
    status_code = 503
    default_detail = 'Spotify is temporarily unavailable. Please try again.'


def configured():
    callback = urlsplit(settings.SPOTIFY_REDIRECT_URI)
    secure_callback = callback.scheme == 'https' or (settings.DEBUG and callback.scheme == 'http' and callback.hostname in ('127.0.0.1', '::1'))
    try:
        Fernet(settings.SPOTIFY_TOKEN_ENCRYPTION_KEY.encode())
    except (ValueError, TypeError):
        return False
    return bool(settings.SPOTIFY_ENABLED and settings.SPOTIFY_CLIENT_ID and settings.SPOTIFY_CLIENT_SECRET and secure_callback)


def cipher():
    return Fernet(settings.SPOTIFY_TOKEN_ENCRYPTION_KEY.encode())


def token_request(payload):
    try:
        response = requests.post('https://accounts.spotify.com/api/token', data=payload,
                                 auth=(settings.SPOTIFY_CLIENT_ID, settings.SPOTIFY_CLIENT_SECRET), timeout=10)
        if response.status_code == 400:
            raise ValidationError({'error': 'Spotify authorization expired. Connect Spotify again.'})
        if not response.ok:
            raise SpotifyError()
        data = response.json()
        if not isinstance(data, dict) or not isinstance(data.get('access_token'), str) or not data['access_token'] or not isinstance(data.get('expires_in'), int) or data['expires_in'] <= 0:
            raise SpotifyError()
        return data
    except (requests.RequestException, ValueError):
        raise SpotifyError()


def store_tokens(connection, data):
    connection.access_token = cipher().encrypt(data['access_token'].encode()).decode()
    if data.get('refresh_token'):
        connection.refresh_token = cipher().encrypt(data['refresh_token'].encode()).decode()
    connection.expires_at = timezone.now() + timedelta(seconds=data['expires_in'])
    connection.save()


class SpotifyStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'configured': configured(), 'connected': SpotifyConnection.objects.filter(user=request.user).exclude(access_token='').exists()})

    def delete(self, request):
        # Also invalidates any unfinished authorization for this app account.
        SpotifyConnection.objects.filter(user=request.user).delete()
        return Response(status=204)


class SpotifyConnectView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        if not configured():
            raise SpotifyError('Spotify is not configured on this server yet.')
        state, verifier = secrets.token_urlsafe(32), secrets.token_urlsafe(64)
        with transaction.atomic():
            connection, _ = SpotifyConnection.objects.select_for_update().get_or_create(user=request.user)
            connection.pending_state = hashlib.sha256(state.encode()).hexdigest()
            connection.pending_verifier = cipher().encrypt(verifier.encode()).decode()
            connection.pending_expires_at = timezone.now() + timedelta(minutes=5)
            connection.save()
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
        return Response({'url': 'https://accounts.spotify.com/authorize?' + urlencode({
            'client_id': settings.SPOTIFY_CLIENT_ID, 'response_type': 'code', 'redirect_uri': settings.SPOTIFY_REDIRECT_URI,
            'scope': SCOPES, 'state': state, 'code_challenge_method': 'S256', 'code_challenge': challenge,
        })})


class SpotifyCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        if not configured():
            raise SpotifyError('Spotify is not configured on this server yet.')
        state = request.query_params.get('state', '')
        with transaction.atomic():
            connection = SpotifyConnection.objects.select_for_update().filter(pending_state=hashlib.sha256(state.encode()).hexdigest()).first()
            if not state or not connection or not connection.pending_expires_at or connection.pending_expires_at <= timezone.now():
                raise ValidationError({'error': 'Invalid or expired Spotify authorization. Return to the app and connect again.'})
            verifier = connection.pending_verifier
            connection.pending_state = ''; connection.pending_verifier = ''; connection.pending_expires_at = None
            connection.save()
            # Commit consumption even when Spotify rejects or times out; a fresh connect can retry.
            failed = bool(request.query_params.get('error') or not request.query_params.get('code'))
            if not failed:
                try:
                    data = token_request({'grant_type': 'authorization_code', 'code': request.query_params['code'],
                                          'redirect_uri': settings.SPOTIFY_REDIRECT_URI, 'code_verifier': cipher().decrypt(verifier.encode()).decode()})
                    if not data.get('refresh_token') or not set(SCOPES.split()).issubset(set(data.get('scope', '').split())):
                        raise SpotifyError()
                    store_tokens(connection, data)
                except (APIException, InvalidToken):
                    failed = True
        message = 'Spotify was not connected. Return to the app and try again.' if failed else 'Spotify connected. Return to the app to control your music.'
        result = HttpResponse('<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Spotify connection</title><body><h1>Exercise App</h1><p>' + message + '</p><a href="exercisefrontend://spotify-connect">Open app</a></body></html>')
        result['Cache-Control'] = 'no-store'
        result['Referrer-Policy'] = 'no-referrer'
        return result


def player_request(connection, method, path):
    try:
        def refresh():
            if not connection.refresh_token:
                raise InvalidToken()
            try:
                data = token_request({'grant_type': 'refresh_token', 'refresh_token': cipher().decrypt(connection.refresh_token.encode()).decode()})
            except ValidationError:
                connection.access_token = ''; connection.refresh_token = ''; connection.save()
                raise
            store_tokens(connection, data)

        if not connection.expires_at or connection.expires_at <= timezone.now() + timedelta(seconds=30):
            refresh()
        for attempt in range(2):
            response = requests.request(method, 'https://api.spotify.com/v1/me/player' + path,
                                        headers={'Authorization': 'Bearer ' + cipher().decrypt(connection.access_token.encode()).decode()}, timeout=10)
            if response.status_code != 401 or attempt:
                break
            refresh()
        if response.status_code == 401:
            connection.access_token = ''; connection.refresh_token = ''; connection.save()
            raise ValidationError({'error': 'Spotify disconnected. Connect your account again.'})
        if response.status_code == 403:
            raise ValidationError({'error': 'Spotify denied access. Playback needs Premium and this account must be allowed to use the Spotify app.'})
        if response.status_code == 404:
            raise ValidationError({'error': 'Open Spotify and start music on a device first.'})
        if response.status_code == 429:
            error = SpotifyError('Spotify request limit reached. Wait a moment before trying again.')
            error.status_code = 429
            raise error
        if not response.ok:
            raise SpotifyError()
        return None if response.status_code == 204 else response.json()
    except InvalidToken:
        connection.access_token = ''; connection.refresh_token = ''; connection.save()
        raise ValidationError({'error': 'Spotify disconnected. Connect your account again.'})
    except (requests.RequestException, ValueError):
        raise SpotifyError()


class SpotifyPlayerView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'spotify'

    def get(self, request):
        return self.run(request)

    def post(self, request):
        if request.data.get('action') not in ('play', 'pause', 'next', 'previous'):
            raise ValidationError({'error': 'Choose play, pause, next or previous.'})
        return self.run(request, request.data['action'])

    def run(self, request, action=None):
        if not configured():
            raise SpotifyError('Spotify is not configured on this server yet.')
        failure = None
        with transaction.atomic():
            connection = SpotifyConnection.objects.select_for_update().filter(user=request.user).first()
            if not connection or not connection.access_token:
                raise ValidationError({'error': 'Connect Spotify first.'})
            try:
                data = player_request(connection, 'POST' if action in ('next', 'previous') else 'PUT' if action else 'GET', '/' + action if action else '')
            except APIException as error:
                failure = error
        # Token invalidation must survive error responses.
        if failure:
            raise failure
        if action:
            return Response(status=204)
        item = (data or {}).get('item') or {}
        track = None
        if item and (data or {}).get('currently_playing_type') == 'track':
            images = item.get('album', {}).get('images', [])
            track = {'name': item.get('name'), 'artists': ', '.join(artist.get('name', '') for artist in item.get('artists', [])),
                     'image': images[-1]['url'] if images else None, 'url': item.get('external_urls', {}).get('spotify')}
        return Response({'is_playing': bool((data or {}).get('is_playing')), 'track': track,
                         'device_active': bool((data or {}).get('device')), 'disallows': (data or {}).get('actions', {}).get('disallows', {})})


class LegacySpotifyTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({'error': 'Use the account-bound Spotify connection in Settings.'}, status=410)
