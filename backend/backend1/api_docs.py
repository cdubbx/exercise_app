from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.generic import TemplateView

from .api_reference import openapi_document


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
