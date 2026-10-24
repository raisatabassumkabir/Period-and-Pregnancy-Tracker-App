"""
Password reset: POST auth/password-resets/ (202, no account enumeration,
idempotent at the API edge and in the worker), then the emailed link's
browser pages, which set the password and sign every device out.
"""

import re
from smtplib import SMTPException
from unittest.mock import patch

import pytest
from celery.exceptions import Retry
from django.core.cache import cache
from django.test import Client
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.tasks import build_password_reset_url, send_password_reset_email
from apps.users.views import PASSWORD_RESET_ACCEPTED_DETAIL

pytestmark = pytest.mark.django_db

PASSWORD_RESET_RATE_PER_HOUR = 5
NEW_PASSWORD = "a-brand-new-sufficiently-long-password"


def _request_reset(email, *, key=None, ip="198.51.100.7"):
    headers = {"HTTP_X_FORWARDED_FOR": ip}
    if key:
        headers["HTTP_IDEMPOTENCY_KEY"] = key
    return APIClient().post(
        reverse("password-resets"), {"email": email}, format="json", **headers
    )


def _request_reset_and_run_tasks(capture, email, **kwargs):
    with capture(execute=True):
        return _request_reset(email, **kwargs)


def test_known_email_gets_202_and_a_reset_link(
    user_a, mailoutbox, django_capture_on_commit_callbacks
):
    response = _request_reset_and_run_tasks(
        django_capture_on_commit_callbacks, user_a.email.upper()
    )

    assert response.status_code == 202
    assert response.json() == {"detail": PASSWORD_RESET_ACCEPTED_DETAIL}
    assert len(mailoutbox) == 1
    assert mailoutbox[0].to == [user_a.email]
    link = r"http://localhost:8000/accounts/password-reset/[^/]+/[^/]+/"
    assert re.search(link, mailoutbox[0].body)


def test_unknown_email_gets_the_same_202_and_no_email(
    mailoutbox, django_capture_on_commit_callbacks
):
    response = _request_reset_and_run_tasks(
        django_capture_on_commit_callbacks, "nobody@example.com"
    )

    assert response.status_code == 202
    assert response.json() == {"detail": PASSWORD_RESET_ACCEPTED_DETAIL}
    assert mailoutbox == []


def test_user_without_usable_password_gets_no_email(
    user_a, mailoutbox, django_capture_on_commit_callbacks
):
    user_a.set_unusable_password()
    user_a.save()

    _request_reset_and_run_tasks(django_capture_on_commit_callbacks, user_a.email)

    assert mailoutbox == []


def test_invalid_email_is_422_problem():
    response = _request_reset("not-an-email")
    assert response.status_code == 422
    assert "email" in response.json()["errors"]


def test_replayed_idempotency_key_sends_one_email(
    user_a, mailoutbox, django_capture_on_commit_callbacks
):
    for _ in range(2):
        response = _request_reset_and_run_tasks(
            django_capture_on_commit_callbacks, user_a.email, key="tap-1"
        )
        assert response.status_code == 202

    assert len(mailoutbox) == 1


def test_idempotency_key_reused_for_another_email_is_409(user_a, user_b):
    assert _request_reset(user_a.email, key="tap-2").status_code == 202

    response = _request_reset(user_b.email, key="tap-2")

    assert response.status_code == 409
    assert response.json()["type"] == "https://apiguide.dev/errors/idempotency-key-conflict"


def test_cooldown_limits_emails_across_different_keys(
    user_a, mailoutbox, django_capture_on_commit_callbacks
):
    for key in ("tap-a", "tap-b"):
        _request_reset_and_run_tasks(django_capture_on_commit_callbacks, user_a.email, key=key)

    assert len(mailoutbox) == 1


def test_worker_dedupes_a_redelivered_task(user_a, mailoutbox):
    assert send_password_reset_email.run(str(user_a.pk), "same-key") is True
    cache.delete(f"pwreset:cooldown:{user_a.pk}")

    assert send_password_reset_email.run(str(user_a.pk), "same-key") is False
    assert len(mailoutbox) == 1


def test_failed_send_releases_the_claim_for_a_retry(user_a):
    claim_key = f"pwreset:sent:{user_a.pk}:k1"
    with (
        patch("apps.users.tasks.send_mail", side_effect=SMTPException("down")),
        patch.object(send_password_reset_email, "retry", side_effect=Retry()),
        pytest.raises(Retry),
    ):
        send_password_reset_email.run(str(user_a.pk), "k1")

    assert cache.get(claim_key) is None
    assert cache.get(f"pwreset:cooldown:{user_a.pk}") is None


def test_reset_requests_are_throttled(user_a):
    for i in range(PASSWORD_RESET_RATE_PER_HOUR):
        assert _request_reset(user_a.email, key=f"k{i}").status_code == 202

    assert _request_reset(user_a.email, key="k-last").status_code == 429


# --- Browser pages the email links to --------------------------------------------


def _open_reset_link(browser, user):
    """GET the emailed link; Django swaps the token into the session and redirects."""
    path = build_password_reset_url(user).removeprefix("http://localhost:8000")
    response = browser.get(path)
    assert response.status_code == 302
    return response["Location"]


def test_reset_link_sets_the_password_and_signs_out_every_device(user_a):
    refresh = RefreshToken.for_user(user_a)
    browser = Client()
    form_url = _open_reset_link(browser, user_a)

    response = browser.post(
        form_url, {"new_password1": NEW_PASSWORD, "new_password2": NEW_PASSWORD}
    )

    assert response.status_code == 302
    assert response["Location"] == reverse("password-reset-complete")
    user_a.refresh_from_db()
    assert user_a.check_password(NEW_PASSWORD)
    old_session = APIClient().post(
        reverse("token_refresh"), {"refresh": str(refresh)}, format="json"
    )
    assert old_session.status_code == 401


def test_reset_link_works_only_once(user_a):
    path = build_password_reset_url(user_a).removeprefix("http://localhost:8000")
    browser = Client()
    form_url = _open_reset_link(browser, user_a)
    browser.post(form_url, {"new_password1": NEW_PASSWORD, "new_password2": NEW_PASSWORD})

    response = Client().get(path)

    assert response.status_code == 200
    assert b"This link has expired" in response.content


def test_tampered_link_shows_the_expired_page(user_a):
    path = build_password_reset_url(user_a).removeprefix("http://localhost:8000")
    tampered = path.rstrip("/") + "x/"

    response = Client().get(tampered)

    assert response.status_code == 200
    assert b"This link has expired" in response.content
