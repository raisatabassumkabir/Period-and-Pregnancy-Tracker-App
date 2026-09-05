"""Liveness, schema, and the response-shape rules that hold for every endpoint."""

import pytest

from tests.e2e.support import assert_json, assert_problem

pytestmark = [pytest.mark.e2e, pytest.mark.django_db(transaction=True)]


def test_health(anon):
    response = anon.get("/health/")
    assert response.status_code == 200
    assert assert_json(response) == {"status": "ok"}


def test_openapi_schema_is_served(anon):
    response = anon.get("/api/schema/")
    assert response.status_code == 200
    assert "openapi" in response.headers["content-type"]
    assert "/api/cycles/" in response.text


def test_docs_page_is_served(anon):
    response = anon.get("/api/docs/")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")


def test_unauthenticated_is_401_json_with_bearer_challenge(anon):
    response = anon.get("/api/cycles/")
    assert_problem(response, 401, "unauthorized")
    assert response.headers.get("www-authenticate", "").startswith("Bearer")


@pytest.mark.parametrize("token", ["not-a-jwt", "eyJhbGciOiJIUzI1NiJ9.e30.invalid-signature"])
def test_garbage_bearer_is_401_json(anon, token):
    response = anon.get("/api/cycles/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert_json(response)


def test_missing_trailing_slash_redirects_and_never_500s(anon):
    response = anon.get("/api/cycles")
    assert response.status_code == 301
    assert response.headers["location"].endswith("/api/cycles/")
