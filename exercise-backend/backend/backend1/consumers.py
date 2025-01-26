from channels.generic.websocket import AsyncJsonWebsocketConsumer
import json

class SpotifyConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("spotify_updates", self.channel_name)
        await self.accept()
    async def disconnect(self, code):
        await self.channel_layer.group_discard("spotify_updates", self.channel_name)
    async def update_track(self, event):
        await self.send(text_data=json.dumps(event["message"]))