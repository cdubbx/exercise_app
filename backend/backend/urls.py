"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from backend1.api_docs import ApiReferenceView, api_reference_json, developer_guide, documentation_home, integration_guide
urlpatterns = [
    path('', documentation_home, name='documentation-home'),
    path('docs/', ApiReferenceView.as_view(), name='api-reference'),
    path('docs/developer-guide/', developer_guide, name='developer-guide'),
    path('docs/integrations/<str:integration>/', integration_guide, name='integration-guide'),
    path('api-reference.json', api_reference_json, name='api-reference-json'),
    path('admin/', admin.site.urls),
    path('api/', include('backend1.urls')),  # Adjust 'accounts.urls' if your app name/path is different
    path('api-auth/', include('rest_framework.urls'))

]

from django.conf import settings
from django.conf.urls.static import static
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
