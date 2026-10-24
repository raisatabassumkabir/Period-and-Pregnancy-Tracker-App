import pytest

from apps.core.rls import rls_user
from apps.cycles.models import Cycle, DailyLog

pytestmark = pytest.mark.django_db

INIT_URL = "/api/cycles/init/"


def test_init_cycle_creates_cycle_and_anchor_log_once(as_user, user_a):
    # as_user sends a real JWT so RLSMiddleware sets app.user_id; with
    # force_authenticate the INSERT would be (correctly) refused by RLS.
    client = as_user(user_a)
    payload = {"start_date": "2026-09-01"}

    first = client.post(INIT_URL, payload, format="json")
    second = client.post(INIT_URL, payload, format="json")

    assert first.status_code == 201
    assert first.json()["start_date"] == "2026-09-01"
    assert second.status_code == 201
    with rls_user(str(user_a.pk)):
        assert Cycle.objects.for_user(user_a).count() == 1
        assert DailyLog.objects.for_user(user_a).count() == 1
