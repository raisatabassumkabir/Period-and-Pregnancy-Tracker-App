"""
Row Level Security helpers.

The policies (created in each app's initial migration) are:

    owner  — row visible/writable only when user_id = app.user_id
    bypass — row visible/writable only when app.bypass = 'on'

Postgres ORs permissive policies together, so a connection needs exactly one of
the two variables set. Both are set with set_config(..., is_local=true), which
scopes them to the CURRENT TRANSACTION. Never use session-level SET here: with
pooled/persistent connections a session variable survives onto the next request
reusing the connection — one user's id handed to another user's request, which
is a worse bug than the one RLS prevents.

Contexts without a request (Celery tasks, management commands, shell) have
neither variable set, so RLS returns ZERO rows — deny by default. They must
explicitly opt in with one of the context managers below. Prefer `rls_user`:
a task acting on behalf of a user should be scoped exactly like that user's
requests, not run with the master key.

CAVEAT: Postgres superusers and roles with BYPASSRLS ignore RLS entirely, even
with FORCE. The application must connect as a plain role (infra/initdb creates
`femtech` for dev). tests/test_rls.py checks this and fails loudly.
"""

from contextlib import contextmanager

from django.db import connection, transaction


def _set_config(cursor, key: str, value: str) -> None:
    # set_config(name, value, is_local=true) -> transaction-local, dies on
    # COMMIT/ROLLBACK. Parametrised: the value is never interpolated into SQL.
    cursor.execute("SELECT set_config(%s, %s, true)", [key, value])


@contextmanager
def rls_user(user_id: str):
    """Scope all queries inside the block to one user, exactly like a request."""
    with transaction.atomic():
        with connection.cursor() as cursor:
            _set_config(cursor, "app.user_id", str(user_id))
        try:
            yield
        finally:
            # Reset explicitly rather than relying on transaction end — in tests
            # (and nested atomics) the enclosing transaction outlives this block.
            with connection.cursor() as cursor:
                _set_config(cursor, "app.user_id", "")


@contextmanager
def rls_bypass():
    """
    Escape hatch for migrations, seeds, admin actions and maintenance tasks.

    Use sparingly and never inside request-handling code paths: anything a
    request needs should be reachable through `for_user()` + the owner policy.
    """
    with transaction.atomic():
        with connection.cursor() as cursor:
            _set_config(cursor, "app.bypass", "on")
        try:
            yield
        finally:
            with connection.cursor() as cursor:
                _set_config(cursor, "app.bypass", "")
