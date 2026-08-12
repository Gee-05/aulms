import logging

from django.conf import settings
from django.core.mail import send_mail

from notifications.models import Notification

logger = logging.getLogger(__name__)


def create_notification(user, notif_type, message):
    return Notification.objects.create(user=user, type=notif_type, message=message)


def send_email_notification(user, subject, message):
    if not user.email:
        return
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
    except Exception:
        logger.exception("Failed to send email notification to %s", user.email)


def notify(user, notif_type, message, email_subject=None):
    """Creates an in-app notification and sends a matching email."""
    create_notification(user, notif_type, message)
    send_email_notification(user, email_subject or message[:78], message)
