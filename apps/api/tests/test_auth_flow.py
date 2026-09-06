"""
End-to-end auth flow: register (anonymous request writing into RLS-protected
users_profile), obtain a JWT, and use it to create and read health data.
Exercises the rls_user() escape path in RegisterSerializer.create.
"""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def test_register_login_and_log_a_day():
    client = APIClient()

    response = client.post(
        reverse("auth-register"),
        {
            "email": "ismam@example.com",
            "password": "a-sufficiently-long-password",
            "profile": {
                "country": "bd",
                "language": "bn",
                "diet": "vegetarian",
                "budget_tier": "low",
                "medical_conditions": ["pcos"],
            },
        },
        format="json",
    )
    assert response.status_code == 201, response.content

    response = client.post(
        reverse("token_obtain_pair"),
        {"email": "ismam@example.com", "password": "a-sufficiently-long-password"},
        format="json",
    )
    assert response.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.json()['access']}")

    # Profile was created under the new user's RLS scope and is readable now.
    profiles = client.get(reverse("profile-list")).json()
    assert profiles["count"] == 1
    assert profiles["results"][0]["country"] == "BD"
    assert profiles["results"][0]["medical_conditions"] == ["pcos"]

    # Create + read back a daily log through the full middleware/RLS path.
    response = client.post(
        reverse("dailylog-list"),
        {"date": "2026-09-01", "flow": "medium", "symptoms": ["cramps"]},
        format="json",
    )
    assert response.status_code == 201, response.content
    assert client.get(reverse("dailylog-list")).json()["count"] == 1


def test_register_rejects_unknown_condition_codes():
    response = APIClient().post(
        reverse("auth-register"),
        {
            "email": "x@example.com",
            "password": "a-sufficiently-long-password",
            "profile": {"medical_conditions": ["definitely-not-a-code"]},
        },
        format="json",
    )
    assert response.status_code == 400
