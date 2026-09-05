"""
Every error the API returns is an RFC 9457 Problem (apps/core/exceptions.py).

One test per problem type this API can currently produce, asserting the
`type` URL, status, content type, and — because this is health data — that a
submitted value never comes back in `detail` or `errors`.
"""

from datetime import date, timedelta

import pytest
from django.urls import reverse
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework_simplejwt.tokens import AccessToken

from apps.core.exceptions import (
    PaymentRequired,
    problem_exception_handler,
)
from apps.cycles.models import DailyLog
from conftest import create_owned
from tests.factories import DailyLogFactory

PROBLEM = "application/problem+json"
BASE = "https://apiguide.dev/errors/"

pytestmark = pytest.mark.django_db


def assert_problem(response, status, slug, *, type_url=None):
    assert response.status_code == status, response.content
    assert response["Content-Type"].startswith(PROBLEM), response["Content-Type"]
    body = response.json()
    assert body["type"] == (type_url or BASE + slug)
    assert body["status"] == status
    assert isinstance(body["title"], str) and body["title"]
    assert isinstance(body["detail"], str) and body["detail"]
    assert body["instance"] == response.wsgi_request.path
    return body


# --- 4xx from real requests -------------------------------------------------------


def test_malformed_json_is_400_malformed_request_body(as_user, user_a):
    response = as_user(user_a).post(
        reverse("dailylog-list"), data="{not json", content_type="application/json"
    )
    body = assert_problem(response, 400, "malformed-request-body")
    assert "errors" not in body


def test_invalid_field_is_422_validation_failed_and_never_echoes_the_value(as_user, user_a):
    response = as_user(user_a).post(
        reverse("dailylog-list"),
        {"date": "2026-09-03", "symptoms": ["telepathy-secret-value"]},
        format="json",
    )
    body = assert_problem(response, 422, "validation-failed")
    assert "symptoms" in body["errors"]
    assert "telepathy-secret-value" not in response.content.decode()


def test_missing_required_field_is_422(as_user, user_a):
    response = as_user(user_a).post(reverse("dailylog-list"), {}, format="json")
    body = assert_problem(response, 422, "validation-failed")
    assert body["errors"]["date"]


def test_non_field_error_becomes_detail(as_user, user_a):
    response = as_user(user_a).post(
        reverse("cycle-list"),
        {"start_date": "2026-07-10", "end_date": "2026-07-01"},
        format="json",
    )
    body = assert_problem(response, 422, "validation-failed")
    assert body["detail"] == "end_date cannot precede start_date."
    assert "non_field_errors" not in body.get("errors", {})


def test_duplicate_daily_log_is_409_resource_conflict(as_user, user_a):
    client = as_user(user_a)
    assert client.post(reverse("dailylog-list"), {"date": "2026-09-02"}).status_code == 201
    response = client.post(reverse("dailylog-list"), {"date": "2026-09-02"})
    body = assert_problem(response, 409, "resource-conflict")
    assert body["errors"]["date"] == ["A log for this date already exists."]
    assert DailyLog.objects.for_user(user_a).count() == 1


def test_duplicate_cycle_start_is_409_resource_conflict(as_user, user_a):
    client = as_user(user_a)
    assert client.post(reverse("cycle-list"), {"start_date": "2026-07-01"}).status_code == 201
    response = client.post(reverse("cycle-list"), {"start_date": "2026-07-01"})
    body = assert_problem(response, 409, "resource-conflict")
    assert "start_date" in body["errors"]


def test_patch_into_existing_date_is_409_not_500(as_user, user_a):
    # The pre-check only guards create; the DB constraint + savepoint guard update.
    first = create_owned(DailyLogFactory, user_a, date=date(2026, 9, 1))
    create_owned(DailyLogFactory, user_a, date=date(2026, 9, 2))
    response = as_user(user_a).patch(
        reverse("dailylog-detail", args=[first.pk]), {"date": "2026-09-02"}, format="json"
    )
    assert_problem(response, 409, "resource-conflict")


def test_second_active_pregnancy_is_409(as_user, user_a):
    client = as_user(user_a)
    assert client.post(reverse("pregnancy-list"), {"due_date": "2027-05-01"}).status_code == 201
    response = client.post(reverse("pregnancy-list"), {"due_date": "2027-05-02"})
    body = assert_problem(response, 409, "resource-conflict")
    assert "status" in body["errors"]


def test_duplicate_email_registration_is_409(user_a):
    response = APIClient().post(
        reverse("auth-register"),
        {"email": user_a.email, "password": "a-sufficiently-long-password"},
        format="json",
    )
    body = assert_problem(response, 409, "resource-conflict")
    assert "email" in body["errors"]


def test_missing_token_is_401_unauthorized_with_bearer_challenge():
    response = APIClient().get(reverse("cycle-list"))
    assert_problem(response, 401, "unauthorized")
    assert response["WWW-Authenticate"].startswith("Bearer")


def test_expired_token_is_401_expired_authentication_token(user_a):
    token = AccessToken.for_user(user_a)
    token.set_exp(lifetime=-timedelta(seconds=1))
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    assert_problem(client.get(reverse("cycle-list")), 401, "expired-authentication-token")


def test_garbage_token_is_401_unauthorized():
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION="Bearer not-a-jwt")
    assert_problem(client.get(reverse("cycle-list")), 401, "unauthorized")


def test_another_users_object_is_404_resource_not_found(as_user, user_a, user_b):
    log = create_owned(DailyLogFactory, user_b)
    response = as_user(user_a).get(reverse("dailylog-detail", args=[log.pk]))
    body = assert_problem(response, 404, "resource-not-found")
    assert str(log.pk) not in body["detail"]


def test_wrong_method_is_405_with_allow_header(as_user, user_a):
    response = as_user(user_a).post(reverse("profile-list"), {}, format="json")
    assert_problem(response, 405, "method-not-allowed")
    assert "GET" in response["Allow"]


def test_wrong_content_type_is_415(as_user, user_a):
    response = as_user(user_a).post(
        reverse("dailylog-list"), data="date=2026-09-01", content_type="text/plain"
    )
    assert_problem(response, 415, "unsupported-media-type")


# --- Exceptions views raise directly ----------------------------------------------


def _handle(exc):
    request = APIRequestFactory().get("/api/anything/")
    from rest_framework.request import Request

    return problem_exception_handler(exc, {"request": Request(request), "view": None})


def test_payment_required_is_402_with_paywall_extension_members():
    response = _handle(
        PaymentRequired(
            "You've used 3 of 3 free chats today.",
            feature="ai_chat",
            current_usage=3,
            limit=3,
            resets_at="2026-09-06T00:00:00Z",
        )
    )
    assert response.status_code == 402
    assert response.content_type == PROBLEM
    body = response.data
    assert body["type"] == "https://apiguide.dev/status-codes/402/"
    assert body["detail"] == "You've used 3 of 3 free chats today."
    assert body["feature"] == "ai_chat"
    assert body["current_usage"] == 3 and body["limit"] == 3
    assert body["resets_at"] == "2026-09-06T00:00:00Z"


def test_unhandled_exception_is_generic_500_problem(settings):
    settings.DEBUG = False
    response = _handle(RuntimeError("secret internal detail"))
    assert response.status_code == 500
    assert response.data["type"] == BASE + "internal-server-error"
    assert "secret internal detail" not in str(response.data)


def test_unhandled_exception_propagates_in_debug(settings):
    settings.DEBUG = True
    assert _handle(RuntimeError("boom")) is None


# --- The schema advertises the shape ----------------------------------------------


def test_openapi_schema_declares_problem_detail(as_user, user_a):
    schema = as_user(user_a).get(reverse("schema"), HTTP_ACCEPT="application/json")
    assert schema.status_code == 200
    doc = schema.json()
    assert "ProblemDetail" in doc["components"]["schemas"]
    post = doc["paths"]["/api/daily-logs/"]["post"]["responses"]
    for code in ("401", "409", "422"):
        assert "application/problem+json" in post[code]["content"]
