from django.core.mail import send_mail
from django.conf import settings
import random
import logging

logger = logging.getLogger(__name__)

def send_otp(email:str, otp:int) -> bool:
    """Send the OTP to the specific email address. """
    subject = "Your One time pin code"
    message = f'Your One-Time Pin (OTP) is: {otp}'
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [email]
    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        return True
    except Exception as e:
        logger.error(f'An unexpected error occurred: {e}', exc_info=True)
        print(e)
        return False
    


def generate_otp(length=4) -> str:
    """Generate a numeric OTP of a specified length as a string"""
    otp: str = ''.join([str(random.randint(0, 9)) for _ in range(length)])
    return otp
