"""Persist canonical object URLs; issue short-lived reads only in API responses."""
import re
from urllib.parse import urlsplit
import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from rest_framework.exceptions import APIException, ValidationError


class StorageUnavailable(APIException):
    status_code = 503
    default_detail = 'Image storage is unavailable. Please try again.'


def s3_client():
    return boto3.client('s3', region_name=settings.AWS_S3_REGION_NAME,
                        config=Config(signature_version='s3v4', connect_timeout=5, read_timeout=10, retries={'max_attempts': 2}))


def media_origin():
    return f'https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com'


def media_key(url):
    if not isinstance(url, str) or not settings.AWS_STORAGE_BUCKET_NAME:
        return None
    parsed = urlsplit(url)
    origin = urlsplit(media_origin())
    if parsed.scheme != origin.scheme or parsed.netloc != origin.netloc:
        return None
    return parsed.path.lstrip('/')


def canonical_media(url, user=None):
    if not url:
        return url
    parsed = urlsplit(url)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname:
        raise ValidationError('Choose a valid image URL.')
    key = media_key(url)
    if key is None:
        return url
    if user is None or not re.fullmatch(r'(profile|exercises)-images/' + re.escape(str(user.id)) + r'/[a-f0-9-]{36}\.(jpg|png|webp)', key):
        raise ValidationError('Choose an image uploaded by your account.')
    return f'{media_origin()}/{key}'


def display_media(url):
    key = media_key(url)
    if key is None:
        return url
    try:
        return s3_client().generate_presigned_url('get_object', Params={'Bucket': settings.AWS_STORAGE_BUCKET_NAME, 'Key': key}, ExpiresIn=settings.AWS_S3_SIGNED_URL_SECONDS)
    except (BotoCoreError, ClientError):
        raise StorageUnavailable()


class MediaSerializerMixin:
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('image_url'):
            data['image_url'] = display_media(data['image_url'])
        if isinstance(data.get('img_url'), list):
            data['img_url'] = [display_media(url) for url in data['img_url']]
        return data

    def validate_image_url(self, value):
        request = self.context.get('request')
        value = canonical_media(value, request.user if request else None)
        if value and len(value) > 255:
            raise ValidationError('This image URL is too long. Upload the image instead.')
        return value

    def validate_img_url(self, value):
        request = self.context.get('request')
        return [canonical_media(url, request.user if request else None) for url in value]
