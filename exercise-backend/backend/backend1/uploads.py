from io import BytesIO
from uuid import uuid4
from PIL import Image, UnidentifiedImageError
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.throttling import ScopedRateThrottle


class ImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'uploads'

    def post(self, request):
        file = request.FILES.get('file')
        folder = request.data.get('path')
        if folder not in ('profile', 'exercises') or not file:
            raise ValidationError({'error': 'An image and a valid upload path are required.'})
        if file.size > 5 * 1024 * 1024:
            raise ValidationError({'error': 'Choose an image smaller than 5 MB.'})
        data = file.read()
        try:
            image = Image.open(BytesIO(data))
            image.verify()
            image_type = image.format
            if image_type not in ('JPEG', 'PNG', 'WEBP'):
                raise ValueError()
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
            raise ValidationError({'error': 'Choose a JPEG, PNG or WebP image.'})
        extension = {'JPEG': 'jpg', 'PNG': 'png', 'WEBP': 'webp'}[image_type]
        key = f'{folder}-images/{request.user.id}/{uuid4()}.{extension}'
        if settings.AWS_STORAGE_BUCKET_NAME:
            import boto3
            boto3.client('s3', region_name=settings.AWS_S3_REGION_NAME).put_object(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key, Body=data,
                ContentType=Image.MIME[image_type])
            url = f'{settings.AWS_MEDIA_BASE_URL.rstrip("/")}/{key}'
        else:
            key = default_storage.save(key, ContentFile(data))
            url = request.build_absolute_uri(default_storage.url(key))
        return Response({'url': url}, status=201)
