from django.urls import re_path
from backend1.consumers import SpotifyConsumer

websocket_urlpatterns = [
    re_path(r"ws/spotify/$", SpotifyConsumer.as_asgi())
]