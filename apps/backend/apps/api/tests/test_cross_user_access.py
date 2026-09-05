"""
The most important test in the repo (ARCHITECTURE §6).

For every user-scoped route: authenticate as user B, request user A's object,
assert 404 — not 403 (existence must not leak), not 200 (data must not leak).

Every user-owned viewset registered on the API router MUST have an entry in
CROSS_USER_ROUTES below; test_every_owned_route_is_registered fails CI the
moment someone adds an endpoint without registering it here.
"""

import pytest
from django.urls import reverse

from apps.core.rls import rls_user
from config.api_router import router
from conftest import create_owned
from tests.factories import CycleFactory, DailyLogFactory, PregnancyFactory, ProfileFactory

# (router basename, factory producing an object owned by the given user)
CROSS_USER_ROUTES = [
    ("profile", ProfileFactory),
    ("cycle", CycleFactory),
    ("dailylog", DailyLogFactory),
    ("pregnancy", PregnancyFactory),
]

pytestmark = pytest.mark.django_db


class TestCrossUserAccess:
    @pytest.mark.parametrize(
        "basename,factory", CROSS_USER_ROUTES, ids=[r[0] for r in CROSS_USER_ROUTES]
    )
    def test_user_b_gets_404_for_user_a_object(self, basename, factory, user_a, user_b, as_user):
        obj = create_owned(factory, user_a)
        url = reverse(f"{basename}-detail", args=[obj.pk])

        # Sanity first: the owner CAN see it. Without this, a broken router or a
        # 404-everything bug would make the assertions below pass vacuously.
        assert as_user(user_a).get(url).status_code == 200

        response = as_user(user_b).get(url)
        assert response.status_code == 404, (
            f"{basename}: expected 404 for another user's object, got {response.status_code}. "
            "A 403 leaks existence; anything else leaks data."
        )

    @pytest.mark.parametrize(
        "basename,factory", CROSS_USER_ROUTES, ids=[r[0] for r in CROSS_USER_ROUTES]
    )
    def test_user_b_cannot_mutate_user_a_object(self, basename, factory, user_a, user_b, as_user):
        obj = create_owned(factory, user_a)
        url = reverse(f"{basename}-detail", args=[obj.pk])
        client = as_user(user_b)

        assert client.patch(url, {"notes": "x"}, format="json").status_code == 404
        assert client.delete(url).status_code in (404, 405)  # 405 where destroy is disabled
        # And the object is untouched. This ORM check runs outside any request,
        # where RLS denies by default — scope it to A the way a request would be.
        with rls_user(str(user_a.pk)):
            assert type(obj).objects.for_user(user_a).filter(pk=obj.pk).exists()

    def test_list_endpoints_are_scoped(self, user_a, user_b, as_user):
        create_owned(DailyLogFactory, user_a)
        response = as_user(user_b).get(reverse("dailylog-list"))
        assert response.status_code == 200
        assert response.json()["count"] == 0

    def test_unauthenticated_requests_are_rejected(self, user_a, as_user):
        from rest_framework.test import APIClient

        obj = create_owned(DailyLogFactory, user_a)
        url = reverse("dailylog-detail", args=[obj.pk])
        assert APIClient().get(url).status_code == 401


def test_every_owned_route_is_registered():
    """
    Walk the API router; any viewset whose model manager exposes for_user()
    (i.e. a user-owned resource) must appear in CROSS_USER_ROUTES. New
    endpoints get registered above or this fails CI.
    """
    covered = {basename for basename, _factory in CROSS_USER_ROUTES}
    missing = []
    for _prefix, viewset, basename in router.registry:
        model = viewset.queryset.model
        if hasattr(model.objects, "for_user") and basename not in covered:
            missing.append(basename)
    assert not missing, (
        f"User-owned routes without a cross-user 404 test: {missing}. "
        "Add them to CROSS_USER_ROUTES in tests/test_cross_user_access.py."
    )
