"""Shared helpers for the e2e suite. Importable by tests (conftest.py is not)."""

from __future__ import annotations

from dataclasses import dataclass

import httpx

# Every account this suite creates carries this prefix so teardown can find
# and remove them without knowing anything else about the tests.
E2E_EMAIL_PREFIX = "e2e-"
STRONG_PASSWORD = "e2e-Str0ng-passphrase-9f1"
REQUEST_TIMEOUT = 10.0


@dataclass
class Account:
    """A registered, logged-in user and an httpx client carrying its access token."""

    id: str
    email: str
    password: str
    access: str
    refresh: str
    client: httpx.Client


def assert_json(response: httpx.Response) -> dict | list:
    """
    Every API response is JSON with the right content type: application/json on
    success, application/problem+json (RFC 9457) on every error.
    """
    content_type = response.headers.get("content-type", "")
    expected = "application/problem+json" if response.status_code >= 400 else "application/json"
    assert content_type.startswith(expected), (
        f"{response.request.method} {response.request.url} -> {response.status_code} "
        f"returned {content_type!r}, not {expected}: {response.text[:300]}"
    )
    return response.json()


def assert_problem(response: httpx.Response, status: int, slug: str) -> dict:
    """An RFC 9457 problem of the given apiguide.dev type. Returns the body."""
    assert response.status_code == status, response.text
    body = assert_json(response)
    assert isinstance(body, dict)
    assert body["type"] == f"https://apiguide.dev/errors/{slug}", body
    assert body["status"] == status
    assert isinstance(body["detail"], str)
    return body
