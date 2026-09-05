"""
End-to-end API tests: the real ASGI entrypoint (config.asgi:application) runs
under uvicorn in a separate process, against the pytest-managed database, and
the tests talk to it over plain HTTP with httpx.

Nothing under tests/e2e touches the ORM or Django settings. The API is a black
box here, exactly as the mobile client sees it: JWT in, JSON out, RLS enforced
by a real Postgres role. If a test needs to reach past HTTP, it is not an e2e
test and belongs in tests/ instead.

Every e2e module carries `pytest.mark.django_db(transaction=True)`. Not for
ORM access: pytest-django only creates the test database for tests that
declare they need one, and `transaction=True` makes it TRUNCATE every table
after each test, which is what isolates tests whose writes were really
committed by another process.
"""

from __future__ import annotations

import os
import socket
import subprocess
import sys
import time
import uuid
from collections.abc import Callable, Iterator
from pathlib import Path
from urllib.parse import quote

import httpx
import pytest
from django.db import connection

from tests.e2e.support import (
    E2E_EMAIL_PREFIX,
    REQUEST_TIMEOUT,
    STRONG_PASSWORD,
    Account,
)

API_ROOT = Path(__file__).resolve().parents[2]
BOOT_TIMEOUT = 30.0


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def _test_database_url() -> str:
    """
    The DSN pytest-django is using *after* it swapped in the test database
    name, so the server process shares exactly the DB the tests will drop.
    """
    db = connection.settings_dict
    host = db.get("HOST") or "localhost"
    port = db.get("PORT") or "5432"
    return f"postgres://{quote(db['USER'])}:{quote(db['PASSWORD'])}@{host}:{port}/{db['NAME']}"


def _wait_until_healthy(proc: subprocess.Popen[bytes], url: str, log_path: Path) -> None:
    deadline = time.monotonic() + BOOT_TIMEOUT
    while time.monotonic() < deadline:
        if proc.poll() is not None:
            raise RuntimeError(
                f"e2e server exited with code {proc.returncode} during boot. "
                f"Log: {log_path}\n{log_path.read_text(encoding='utf-8')[-4000:]}"
            )
        try:
            if httpx.get(f"{url}/health/", timeout=1.0).status_code == 200:
                return
        except httpx.HTTPError:
            pass
        time.sleep(0.2)
    proc.terminate()
    raise RuntimeError(f"e2e server did not become healthy within {BOOT_TIMEOUT}s. Log: {log_path}")


@pytest.fixture(scope="session")
def live_server_url(django_db_setup, tmp_path_factory) -> Iterator[str]:
    """
    Boot uvicorn on a free loopback port for the whole session.

    Depends on django_db_setup so the test database exists and is migrated
    (RLS policies included) before the server connects, and so pytest tears
    the server down *before* pytest-django drops that database.
    """
    port = _free_port()
    url = f"http://127.0.0.1:{port}"
    log_path = tmp_path_factory.mktemp("e2e") / "server.log"

    env = {
        **os.environ,
        # config/asgi.py uses setdefault(), so these win over its prod default
        # and over .env.local (python-dotenv never overrides existing vars).
        "DJANGO_SETTINGS_MODULE": "config.settings.test",
        "DATABASE_URL": _test_database_url(),
        "ALLOWED_HOSTS": "127.0.0.1,localhost",
        "PYTHONUNBUFFERED": "1",
    }
    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "config.asgi:application",
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
        "--log-level",
        "warning",
    ]
    with log_path.open("wb") as log:
        proc = subprocess.Popen(cmd, cwd=API_ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
    try:
        _wait_until_healthy(proc, url, log_path)
        yield url
    finally:
        # Must be dead before pytest-django drops the database it is connected to.
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()


@pytest.fixture
def anon(live_server_url: str) -> Iterator[httpx.Client]:
    """Unauthenticated client."""
    with httpx.Client(base_url=live_server_url, timeout=REQUEST_TIMEOUT) as client:
        yield client


@pytest.fixture
def make_account(live_server_url: str) -> Iterator[Callable[..., Account]]:
    """Register + log in a fresh user through the public API. Returns a factory."""
    clients: list[httpx.Client] = []

    def _make(profile: dict | None = None) -> Account:
        email = f"{E2E_EMAIL_PREFIX}{uuid.uuid4().hex[:12]}@example.com"
        body: dict = {"email": email, "password": STRONG_PASSWORD}
        if profile is not None:
            body["profile"] = profile
        with httpx.Client(base_url=live_server_url, timeout=REQUEST_TIMEOUT) as public:
            registered = public.post("/api/auth/register/", json=body)
            assert registered.status_code == 201, registered.text
            logged_in = public.post(
                "/api/auth/token/", json={"email": email, "password": STRONG_PASSWORD}
            )
            assert logged_in.status_code == 200, logged_in.text
        tokens = logged_in.json()
        client = httpx.Client(
            base_url=live_server_url,
            timeout=REQUEST_TIMEOUT,
            headers={"Authorization": f"Bearer {tokens['access']}"},
        )
        clients.append(client)
        return Account(
            id=registered.json()["id"],
            email=email,
            password=STRONG_PASSWORD,
            access=tokens["access"],
            refresh=tokens["refresh"],
            client=client,
        )

    yield _make
    for client in clients:
        client.close()


@pytest.fixture
def alice(make_account) -> Account:
    return make_account()


@pytest.fixture
def bob(make_account) -> Account:
    return make_account()
