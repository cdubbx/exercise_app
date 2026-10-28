from django.http import FileResponse, JsonResponse
from django.http import Http404
from django.shortcuts import redirect, render
from django.views.generic import TemplateView
from pathlib import Path

from .api_reference import openapi_document


def favicon(request):
    icon = Path(__file__).resolve().parent / 'static' / 'backend1' / 'favicon.png'
    response = FileResponse(icon.open('rb'), content_type='image/png')
    response['Cache-Control'] = 'public, max-age=86400'
    return response


def documentation_home(request):
    return redirect('/docs/')


class ApiReferenceView(TemplateView):
    template_name = 'backend1/api_reference.html'


def api_reference_json(request):
    response = JsonResponse(openapi_document())
    response['Cache-Control'] = 'public, max-age=300'
    return response


def developer_guide(request):
    return render(request, 'backend1/developer_guide.html')


def integration_guide(request, integration):
    guides = {
        's3': ('AWS S3 image storage and uploads', 'Keep profile and exercise images in private S3 storage, and learn how the app uploads and displays them.', 'backend1/integrations/s3.html'),
        'spotify': ('Spotify connection and player', 'See how Spotify authorization, protected tokens, playback requests, and player controls work.', 'backend1/integrations/spotify.html'),
        'exercise-bot': ('Exercise Bot and OpenAI', 'Follow a chat request from the app through OpenAI and see how workout suggestions are checked before calendar save.', 'backend1/integrations/exercise_bot.html'),
    }
    if integration not in guides:
        raise Http404('Integration guide not found.')
    title, description, content_template = guides[integration]
    return render(request, 'backend1/integration_guide.html', {
        'title': title,
        'description': description,
        'content_template': content_template,
        'integration': integration,
    })
