import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from apps.core.rls import rls_bypass
from tests.factories import UserFactory


@pytest.fixture
def user_a(db):
    return UserFactory()


@pytest.fixture
def user_b(db):
    return UserFactory()


@pytest.fixture
def as_user():
    """
    Client authenticated with a REAL JWT, not force_authenticate: the request
    must flow through RLSMiddleware's token resolution exactly as production
    traffic does, or the tests wouldn't exercise the RLS path at all.
    """

    def _client(user):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {AccessToken.for_user(user)}")
        return client

    return _client


def create_owned(factory_cls, user, **kwargs):
    """
    Create test data for an arbitrary user.

    Test setup runs outside any request, so app.user_id is unset and (with a
    proper non-superuser DB role) FORCE RLS would reject the INSERT. The bypass
    context manager is exactly the sanctioned escape hatch for seeding.
    """
    with rls_bypass():
        return factory_cls(user=user, **kwargs)
