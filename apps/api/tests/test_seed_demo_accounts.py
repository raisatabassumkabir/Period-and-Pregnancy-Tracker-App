import datetime

import pytest
from django.core.management import call_command

from apps.core.management.commands.seed_demo_accounts import ACCOUNTS
from apps.core.rls import rls_bypass, rls_user
from apps.cycles.models import Cycle
from apps.sharing.models import PartnerLink, SharedStatus
from apps.users.models import Profile, User

pytestmark = pytest.mark.django_db

CLAIRE = "claire.cycle@gmail.com"


@pytest.fixture
def seeded(settings):
    settings.DEBUG = True
    call_command("seed_demo_accounts")


def _user(email):
    return User.objects.get(email=email)


def test_every_demo_login_works_against_the_api(seeded, client):
    for account in ACCOUNTS:
        response = client.post(
            "/api/auth/token/",
            {"email": account.email, "password": account.password},
            content_type="application/json",
        )
        assert response.status_code == 200, account.email


def test_running_twice_creates_no_duplicates(seeded):
    call_command("seed_demo_accounts")
    claire = _user(CLAIRE)
    assert User.objects.filter(email=CLAIRE).count() == 1
    with rls_user(str(claire.pk)):
        assert Cycle.objects.for_user(claire).count() == 3


def test_claire_matches_the_app_seed(seeded):
    claire = _user(CLAIRE)
    with rls_user(str(claire.pk)):
        status = SharedStatus.objects.visible_to(claire).get(user=claire)
    # Latest cycle started 10 days ago on a 28-day cycle.
    assert status.next_period_date == datetime.date.today() + datetime.timedelta(days=18)


def test_clean_test_accounts_have_no_profile(seeded):
    test1 = _user("test1@happywomen.com")
    with rls_user(str(test1.pk)):
        assert not Profile.objects.for_user(test1).exists()


def test_reseeding_unlinks_demo_partners(seeded):
    with rls_bypass():
        PartnerLink.objects.create(owner=_user(CLAIRE), partner=_user("daniel.partner@gmail.com"))
    call_command("seed_demo_accounts")
    with rls_bypass():
        assert not PartnerLink.objects.exists()


def test_refuses_to_run_in_production(settings):
    settings.DEBUG = False
    with pytest.raises(Exception, match="DEBUG=False"):
        call_command("seed_demo_accounts")
