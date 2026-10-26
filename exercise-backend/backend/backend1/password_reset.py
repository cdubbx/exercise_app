from urllib.parse import urlencode

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.shortcuts import render
from django.views.decorators.http import require_GET

from .models import User


@require_GET
def password_reset_landing(request):
    email = request.GET.get('email', '')
    token = request.GET.get('token', '')
    user = User.objects.filter(email=email).first()
    valid = bool(user and PasswordResetTokenGenerator().check_token(user, token))
    app_link = 'exercisefrontend://reset-password?' + urlencode({'email': email, 'token': token}) if valid else None
    response = render(request, 'backend1/password_reset.html', {'app_link': app_link}, status=200 if valid else 400)
    response['Cache-Control'] = 'no-store'
    response['Referrer-Policy'] = 'no-referrer'
    return response
