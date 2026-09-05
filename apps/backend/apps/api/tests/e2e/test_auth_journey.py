"""Register, login, use, refresh, rotate, and every way auth must fail."""

import uuid

import pytest

from tests.e2e.support import E2E_EMAIL_PREFIX, STRONG_PASSWORD, assert_json, assert_problem

pytestmark = [pytest.mark.e2e, pytest.mark.django_db(transaction=True)]


def _fresh_email() -> str:
    return f"{E2E_EMAIL_PREFIX}{uuid.uuid4().hex[:12]}@example.com"


def test_register_login_and_read_own_profile(anon):
    email = _fresh_email()
    response = anon.post(
        "/api/auth/register/",
        json={
            "email": email,
            "password": STRONG_PASSWORD,
            "profile": {
                "country": "bd",
                "language": "bn",
                "diet": "vegetarian",
                "budget_tier": "low",
                "medical_conditions": ["pcos"],
            },
        },
    )
    assert response.status_code == 201, response.text
    body = assert_json(response)
    assert body["email"] == email
    assert "password" not in body
    uuid.UUID(body["id"])  # unguessable ids, not sequential integers

    response = anon.post("/api/auth/token/", json={"email": email, "password": STRONG_PASSWORD})
    assert response.status_code == 200, response.text
    tokens = assert_json(response)
    assert set(tokens) == {"access", "refresh"}

    response = anon.get("/api/profiles/", headers={"Authorization": f"Bearer {tokens['access']}"})
    assert response.status_code == 200
    page = assert_json(response)
    assert page["count"] == 1
    profile = page["results"][0]
    assert profile["country"] == "BD"  # normalised server-side
    assert profile["medical_conditions"] == ["pcos"]
    assert profile["diet"] == "vegetarian"


def test_register_without_profile_still_creates_default_profile(alice):
    page = assert_json(alice.client.get("/api/profiles/"))
    assert page["count"] == 1
    assert page["results"][0]["mode"] == "cycle_tracking"


def test_refresh_rotates_and_blacklists_old_token(anon, alice):
    response = anon.post("/api/auth/token/refresh/", json={"refresh": alice.refresh})
    assert response.status_code == 200, response.text
    rotated = assert_json(response)
    assert rotated["access"] != alice.access
    assert rotated["refresh"] != alice.refresh

    # New access token works.
    response = anon.get("/api/profiles/", headers={"Authorization": f"Bearer {rotated['access']}"})
    assert response.status_code == 200

    # Old refresh token is dead after rotation.
    response = anon.post("/api/auth/token/refresh/", json={"refresh": alice.refresh})
    assert response.status_code == 401
    assert_json(response)

    # New refresh token still works.
    response = anon.post("/api/auth/token/refresh/", json={"refresh": rotated["refresh"]})
    assert response.status_code == 200


def test_token_types_are_not_interchangeable(anon, alice):
    response = anon.post("/api/auth/token/refresh/", json={"refresh": alice.access})
    assert response.status_code == 401
    response = anon.get("/api/profiles/", headers={"Authorization": f"Bearer {alice.refresh}"})
    assert response.status_code == 401


def test_wrong_password_is_401_json(anon, alice):
    response = anon.post(
        "/api/auth/token/", json={"email": alice.email, "password": "definitely-not-it"}
    )
    assert_problem(response, 401, "unauthorized")


def test_duplicate_email_is_409(anon, alice):
    response = anon.post(
        "/api/auth/register/", json={"email": alice.email, "password": STRONG_PASSWORD}
    )
    assert "email" in assert_problem(response, 409, "resource-conflict")["errors"]


@pytest.mark.parametrize("password", ["short", "password", "12345678"])
def test_weak_password_is_422(anon, password):
    response = anon.post(
        "/api/auth/register/", json={"email": _fresh_email(), "password": password}
    )
    assert "password" in assert_problem(response, 422, "validation-failed")["errors"]


def test_unknown_condition_code_is_422(anon):
    response = anon.post(
        "/api/auth/register/",
        json={
            "email": _fresh_email(),
            "password": STRONG_PASSWORD,
            "profile": {"medical_conditions": ["not-a-code"]},
        },
    )
    body = assert_problem(response, 422, "validation-failed")
    assert "medical_conditions" in body["errors"]["profile"]
    assert "not-a-code" not in response.text


def test_profile_update_and_immutable_routes(alice):
    profile = assert_json(alice.client.get("/api/profiles/"))["results"][0]

    response = alice.client.patch(
        f"/api/profiles/{profile['id']}/",
        json={"mode": "pregnancy", "medical_conditions": ["anemia", "pcos", "anemia"]},
    )
    assert response.status_code == 200, response.text
    updated = assert_json(response)
    assert updated["mode"] == "pregnancy"
    assert updated["medical_conditions"] == ["anemia", "pcos"]  # deduped and sorted

    # One profile per user, created at registration: no create, no delete.
    assert alice.client.post("/api/profiles/", json={"mode": "postpartum"}).status_code == 405
    assert alice.client.delete(f"/api/profiles/{profile['id']}/").status_code == 405
