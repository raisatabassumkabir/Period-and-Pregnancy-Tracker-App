import logging

from celery import shared_task
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from apps.users.models import User

logger = logging.getLogger(__name__)

PASSWORD_RESET_SUBJECT = "Reset your Happy Women password"
# One email per user per minute, whatever idempotency keys the client sends.
RESET_EMAIL_COOLDOWN_SECONDS = 60
# Matches the API edge's Idempotency-Key retention.
SEND_CLAIM_TTL_SECONDS = 24 * 60 * 60


def build_password_reset_url(user: User) -> str:
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    path = reverse("password-reset-confirm", kwargs={"uidb64": uidb64, "token": token})
    return f"{settings.PUBLIC_BASE_URL}{path}"


def deliver_password_reset_email(user: User) -> None:
    body = render_to_string(
        "users/emails/password_reset.txt",
        {
            "reset_url": build_password_reset_url(user),
            "valid_minutes": settings.PASSWORD_RESET_TIMEOUT // 60,
        },
    )
    send_mail(PASSWORD_RESET_SUBJECT, body, None, [user.email])


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email(self, user_id: str, idempotency_key: str) -> bool:
    """
    Worker half of the password-reset idempotency contract: the API edge
    dedupes replayed requests, this claim dedupes redelivered tasks.
    """
    claim_key = f"pwreset:sent:{user_id}:{idempotency_key}"
    cooldown_key = f"pwreset:cooldown:{user_id}"
    if not cache.add(claim_key, True, SEND_CLAIM_TTL_SECONDS):
        return False
    if not cache.add(cooldown_key, True, RESET_EMAIL_COOLDOWN_SECONDS):
        return False

    user = User.objects.filter(pk=user_id, is_active=True).first()
    if user is None:
        return False

    try:
        deliver_password_reset_email(user)
    except Exception as exc:
        # Release both so the retry (or the user's next tap) can send.
        cache.delete_many([claim_key, cooldown_key])
        logger.warning("Password reset email for user %s failed; retrying.", user_id)
        raise self.retry(exc=exc) from exc
    return True
