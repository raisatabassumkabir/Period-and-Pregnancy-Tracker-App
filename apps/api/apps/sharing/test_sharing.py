import datetime

import pytest
from django.utils import timezone

from apps.core.rls import rls_bypass, rls_user
from apps.sharing.models import PartnerInvite, PartnerLink, SharedStatus
from apps.sharing.serializers import SharedStatusSerializer
from apps.sharing.services import hash_code, normalise_code
from apps.users.models import Profile
from conftest import create_owned
from tests.factories import CycleFactory, ProfileFactory, UserFactory

pytestmark = pytest.mark.django_db

INVITES = "/api/partner-invites/"
LINKS = "/api/partner-links/"
STATUSES = "/api/shared-statuses/"
PROBLEM_JSON = "application/problem+json"
# Exactly what a partner may ever see (ARCHITECTURE §6). Adding a field here
# needs a privacy review; this test is the tripwire.
SHARED_FIELDS = {
    "owner_name",
    "mode",
    "cycle_length",
    "period_length",
    "last_period_start",
    "next_period_date",
    "ovulation_date",
    "pregnancy_due_date",
    "updated_at",
}


@pytest.fixture
def her(user_a):
    create_owned(ProfileFactory, user_a, mode=Profile.Mode.TRYING_TO_CONCEIVE)
    create_owned(CycleFactory, user_a, start_date=datetime.date(2026, 10, 20))
    return user_a


def invite(client, name="Raisa"):
    response = client.post(INVITES, {"display_name": name}, format="json")
    assert response.status_code == 201
    return response.json()


def link(as_user, her, partner):
    code = invite(as_user(her))["code"]
    response = as_user(partner).post(LINKS, {"code": code, "display_name": "Sam"}, format="json")
    assert response.status_code == 201
    return response.json()


def assert_problem(response, status):
    assert response.status_code == status
    assert response["Content-Type"].startswith(PROBLEM_JSON)


class TestInvites:
    def test_create_returns_the_code_and_link(self, as_user, her):
        body = invite(as_user(her))
        assert body["code"].startswith("HW-")
        assert body["url"].endswith(f"/p/{body['code']}")
        with rls_user(str(her.pk)):
            stored = PartnerInvite.objects.for_user(her).get()
        assert stored.code_hash == hash_code(body["code"])

    def test_no_new_invite_while_linked(self, as_user, her, user_b):
        code = invite(as_user(her))["code"]
        as_user(user_b).post(LINKS, {"code": code}, format="json")
        response = as_user(her).post(INVITES, {}, format="json")
        assert_problem(response, 409)

    def test_she_can_read_her_open_invite_again(self, as_user, her):
        created = invite(as_user(her))
        response = as_user(her).get(INVITES)
        assert response.status_code == 200
        assert response["Cache-Control"] == "private, no-store"
        [current] = response.json()
        assert current["code"] == created["code"]
        assert current["url"] == created["url"]

    def test_open_invite_list_hides_redeemed_and_expired(self, as_user, her, user_b):
        code = invite(as_user(her))["code"]
        as_user(user_b).post(LINKS, {"code": code}, format="json")
        assert as_user(her).get(INVITES).json() == []
        with rls_user(str(her.pk)):
            assert PartnerInvite.objects.for_user(her).get().code == ""

    def test_nobody_else_sees_her_invite(self, as_user, her, user_b):
        invite(as_user(her))
        assert as_user(user_b).get(INVITES).json() == []

    def test_landing_page_offers_to_open_the_app(self, client, as_user, her):
        code = invite(as_user(her))["code"]
        assert f"happywomen://p/{code}".encode() in client.get(f"/p/{code}").content

    def test_new_invite_replaces_the_open_one(self, as_user, her):
        invite(as_user(her))
        invite(as_user(her))
        with rls_user(str(her.pk)):
            assert PartnerInvite.objects.for_user(her).count() == 1

    def test_creating_an_invite_prepares_her_status(self, as_user, her):
        invite(as_user(her))
        with rls_user(str(her.pk)):
            assert SharedStatus.objects.visible_to(her).get().next_period_date == datetime.date(
                2026, 11, 17
            )


class TestRedeem:
    def test_partner_links_with_a_messy_code(self, as_user, her, user_b):
        code = invite(as_user(her))["code"]
        messy = code.lower().replace("-", " ")
        response = as_user(user_b).post(LINKS, {"code": messy}, format="json")
        assert response.status_code == 201
        assert response.json()["role"] == "partner"
        assert response.json()["other_name"] == "Raisa"

    def test_unknown_and_expired_codes_look_the_same(self, as_user, her, user_b):
        code = invite(as_user(her))["code"]
        with rls_bypass():
            PartnerInvite.objects.update(expires_at=timezone.now() - datetime.timedelta(minutes=1))
        expired = as_user(user_b).post(LINKS, {"code": code}, format="json")
        unknown = as_user(user_b).post(LINKS, {"code": "HW-AAAA-BBBB"}, format="json")
        assert_problem(expired, 404)
        assert_problem(unknown, 404)
        assert expired.json()["detail"] == unknown.json()["detail"]

    def test_code_is_single_use(self, as_user, her, user_b):
        code = invite(as_user(her))["code"]
        assert as_user(user_b).post(LINKS, {"code": code}, format="json").status_code == 201
        third = UserFactory()
        assert_problem(as_user(third).post(LINKS, {"code": code}, format="json"), 404)

    def test_cannot_link_to_yourself(self, as_user, her):
        code = invite(as_user(her))["code"]
        assert_problem(as_user(her).post(LINKS, {"code": code}, format="json"), 422)

    def test_already_linked_is_a_conflict(self, as_user, her, user_b):
        link(as_user, her, user_b)
        other = UserFactory()
        code = invite(as_user(other))["code"]
        assert_problem(as_user(user_b).post(LINKS, {"code": code}, format="json"), 409)

    def test_redeem_is_throttled(self, as_user, user_b):
        client = as_user(user_b)
        statuses = [
            client.post(LINKS, {"code": "HW-AAAA-AAAA"}, format="json").status_code
            for _ in range(11)
        ]
        assert statuses[-1] == 429


class TestSharedStatus:
    def test_partner_sees_only_the_allowed_fields(self, as_user, her, user_b):
        link(as_user, her, user_b)
        response = as_user(user_b).get(STATUSES)
        assert response.status_code == 200
        assert response["Cache-Control"] == "private, no-store"
        [status] = response.json()
        assert set(status) == SHARED_FIELDS
        assert set(SharedStatusSerializer.Meta.fields) | {"owner_name"} == SHARED_FIELDS
        assert status["owner_name"] == "Raisa"
        assert status["ovulation_date"] == "2026-11-03"

    def test_partner_cannot_read_her_cycles(self, as_user, her, user_b):
        link(as_user, her, user_b)
        assert as_user(user_b).get("/api/cycles/").json()["count"] == 0

    def test_unlinked_user_sees_nothing(self, as_user, her, user_b):
        invite(as_user(her))
        assert as_user(user_b).get(STATUSES).json() == []

    def test_turning_off_fertile_sharing_hides_it_immediately(self, as_user, her, user_b):
        link_id = link(as_user, her, user_b)["id"]
        response = as_user(her).patch(
            f"{LINKS}{link_id}/", {"share_fertile_window": False}, format="json"
        )
        assert response.status_code == 200
        assert as_user(user_b).get(STATUSES).json()[0]["ovulation_date"] is None

    def test_status_follows_a_new_period(self, as_user, her, user_b):
        link(as_user, her, user_b)
        as_user(her).post("/api/cycles/", {"start_date": "2026-11-16"}, format="json")
        assert as_user(user_b).get(STATUSES).json()[0]["last_period_start"] == "2026-11-16"


class TestLinkManagement:
    def test_only_she_changes_share_settings(self, as_user, her, user_b):
        link_id = link(as_user, her, user_b)["id"]
        response = as_user(user_b).patch(
            f"{LINKS}{link_id}/", {"share_pregnancy": False}, format="json"
        )
        assert_problem(response, 403)

    @pytest.mark.parametrize("who", ["her", "partner"])
    def test_either_side_can_unlink_and_access_ends(self, as_user, her, user_b, who):
        link_id = link(as_user, her, user_b)["id"]
        actor = her if who == "her" else user_b
        assert as_user(actor).delete(f"{LINKS}{link_id}/").status_code == 204
        assert as_user(user_b).get(STATUSES).json() == []
        with rls_bypass():
            assert not PartnerLink.objects.exists()

    def test_deleting_her_account_removes_link_and_status(self, as_user, her, user_b):
        link(as_user, her, user_b)
        with rls_bypass():
            her.delete()
            assert not PartnerLink.objects.exists()
            assert not SharedStatus.objects.exists()


def test_normalise_code():
    assert normalise_code(" hw-7k3m q9xa ") == "HW-7K3M-Q9XA"
    assert normalise_code("7K3MQ9XA") == "HW-7K3M-Q9XA"


class TestInviteLinkPages:
    def test_landing_page_shows_a_valid_code(self, client):
        response = client.get("/p/hw-7k3m-q9xa")
        assert response.status_code == 200
        assert b"HW-7K3M-Q9XA" in response.content

    def test_landing_page_rejects_anything_else(self, client):
        assert client.get("/p/%3Cscript%3E").status_code == 404

    def test_asset_links_lists_the_configured_fingerprint(self, client, settings):
        settings.ANDROID_APP_SHA256_FINGERPRINTS = ["AA:BB"]
        [statement] = client.get("/.well-known/assetlinks.json").json()
        assert statement["target"]["package_name"] == settings.ANDROID_APP_PACKAGE
        assert statement["target"]["sha256_cert_fingerprints"] == ["AA:BB"]
