"""
Production hardening: rate limits, health check, hidden API docs, and MeView
surfacing real failures instead of reporting a paying user as free.
"""

from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.payments.models import Subscription
from conftest import create_owned
from tests.factories import SubscriptionFactory

pytestmark = pytest.mark.django_db

AUTH_TOKEN_RATE_PER_MINUTE = 10
CLIENT_IP = "203.0.113.10"
OTHER_CLIENT_IP = "203.0.113.20"


def _login_attempt(client, email, ip):
    # Traefik appends the real client IP; NUM_PROXIES=1 makes DRF key on it.
    return client.post(
        reverse("token_obtain_pair"),
        {"email": email, "password": "wrong-password"},
        format="json",
        HTTP_X_FORWARDED_FOR=ip,
    )


def test_login_is_throttled_per_client_ip(user_a):
    client = APIClient()
    for _ in range(AUTH_TOKEN_RATE_PER_MINUTE):
        assert _login_attempt(client, user_a.email, CLIENT_IP).status_code == 401

    throttled = _login_attempt(client, user_a.email, CLIENT_IP)
    assert throttled.status_code == 429
    assert throttled["Content-Type"].startswith("application/problem+json")
    assert throttled.json()["type"] == "https://apiguide.dev/errors/rate-limit-exceeded"
    assert "Retry-After" in throttled

    # A different client behind the same proxy keeps its own budget.
    assert _login_attempt(client, user_a.email, OTHER_CLIENT_IP).status_code == 401


def test_webhook_is_not_throttled():
    client = APIClient()
    for _ in range(AUTH_TOKEN_RATE_PER_MINUTE + 1):
        response = client.post(reverse("revenuecat-webhook"), {}, format="json")
        assert response.status_code == 401


def test_health_endpoint_returns_ok_json():
    response = APIClient().get("/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_docs_are_not_routed_when_disabled():
    client = APIClient()
    assert client.get("/api/schema/").status_code == 404
    assert client.get("/api/docs/").status_code == 404


def test_assistant_stub_is_not_routed(as_user, user_a):
    response = as_user(user_a).post("/api/v1/assistant/chat/", {"query": "hi"}, format="json")
    assert response.status_code == 404


def test_me_surfaces_subscription_failures_as_500(as_user, user_a, settings):
    settings.DEBUG = False
    create_owned(SubscriptionFactory, user_a)

    with patch.object(Subscription, "has_active_access", side_effect=RuntimeError("db gone")):
        response = as_user(user_a).get(reverse("user-me-slash"))

    assert response.status_code == 500
    assert response.json()["type"] == "https://apiguide.dev/errors/internal-server-error"
