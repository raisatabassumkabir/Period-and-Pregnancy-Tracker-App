"""
Layer-2 tests: prove the Postgres policies themselves block unscoped access,
independent of the application code.

These use bare `.objects` access ON PURPOSE — the whole point is to query the
way a forgotten `.for_user()` would and watch the database refuse. The CI lint
(scripts/lint_owned_queries.py) only scans views, so this file is fine.
"""

import datetime

import pytest
from django.db import connection

from apps.core.rls import rls_bypass, rls_user
from apps.cycles.models import DailyLog
from conftest import create_owned
from tests.factories import DailyLogFactory

pytestmark = pytest.mark.django_db


def _connection_bypasses_rls() -> bool:
    # Superusers and BYPASSRLS roles ignore RLS entirely, even with FORCE.
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT current_setting('is_superuser') = 'on'"
            " OR (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user)"
        )
        return cursor.fetchone()[0]


@pytest.fixture(autouse=True)
def _require_rls_capable_role():
    if _connection_bypasses_rls():
        pytest.skip(
            "DB role is superuser/BYPASSRLS, so RLS is not enforced on this "
            "connection. Connect as the non-superuser app role (see "
            "infra/initdb/01-app-role.sql) — in production this configuration "
            "would silently disable security layer 2."
        )


def test_unset_user_id_yields_zero_rows(user_a):
    create_owned(DailyLogFactory, user_a)
    # No app.user_id, no bypass: the owner policy compares NULL → deny.
    assert DailyLog.objects.count() == 0


def test_other_users_scope_yields_zero_rows(user_a, user_b):
    log = create_owned(DailyLogFactory, user_a)
    with rls_user(str(user_b.pk)):
        assert not DailyLog.objects.filter(pk=log.pk).exists()
    with rls_user(str(user_a.pk)):
        assert DailyLog.objects.filter(pk=log.pk).exists()


def test_insert_for_wrong_user_is_rejected(user_a, user_b):
    from django.db import transaction, utils

    with rls_user(str(user_b.pk)):
        # WITH CHECK: B's session may not insert a row owned by A. The inner
        # atomic() gives the failed INSERT its own savepoint so the rls_user
        # cleanup afterwards doesn't run inside an aborted transaction.
        with pytest.raises(utils.ProgrammingError), transaction.atomic():
            DailyLog.objects.create(user=user_a, date=datetime.date(2026, 2, 1))


def test_bypass_sees_everything_and_resets(user_a):
    log = create_owned(DailyLogFactory, user_a)
    with rls_bypass():
        assert DailyLog.objects.filter(pk=log.pk).exists()
    # Bypass must not survive the context manager.
    assert DailyLog.objects.count() == 0
