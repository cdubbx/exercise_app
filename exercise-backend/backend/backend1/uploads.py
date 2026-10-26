from io import BytesIO
from uuid import uuid4
from PIL import Image, ImageOps, UnidentifiedImageError
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.throttling import ScopedRateThrottle
from botocore.exceptions import BotoCoreError, ClientError
from .media import StorageUnavailable, display_media, media_origin, s3_client


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
        try:
            image = Image.open(file)
            image_type = image.format
            if image_type not in ('JPEG', 'PNG', 'WEBP') or image.width * image.height > 16_000_000:
                raise ValueError()
            image.load()
            image = ImageOps.exif_transpose(image)
            # Re-encode pixels, dropping location/EXIF and other uploaded metadata.
            clean = Image.new('RGBA' if 'A' in image.getbands() else 'RGB', image.size)
            clean.paste(image)
            clean.thumbnail((2048, 2048))
            output = BytesIO()
            clean.save(output, format=image_type)
            data = output.getvalue()
            if len(data) > 5 * 1024 * 1024:
                raise ValueError()
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
            raise ValidationError({'error': 'Choose a JPEG, PNG or WebP image under 16 megapixels and 5 MB.'})
        extension = {'JPEG': 'jpg', 'PNG': 'png', 'WEBP': 'webp'}[image_type]
        key = f'{folder}-images/{request.user.id}/{uuid4()}.{extension}'
        if settings.AWS_STORAGE_BUCKET_NAME:
            try:
                s3_client().put_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key, Body=data,
                                       ContentType=Image.MIME[image_type], CacheControl='private, max-age=3600')
                url = display_media(f'{media_origin()}/{key}')
            except (BotoCoreError, ClientError):
                raise StorageUnavailable()
        elif settings.DEBUG:
            key = default_storage.save(key, ContentFile(data))
            url = request.build_absolute_uri(default_storage.url(key))
        else:
            raise StorageUnavailable('Image storage has not been configured on this server yet.')
        return Response({'url': url}, status=201)
