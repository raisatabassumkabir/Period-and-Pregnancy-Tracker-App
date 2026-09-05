"""
The cross-user guarantee (ARCHITECTURE §6) checked from outside the process:
user B never sees, changes, or learns the existence of user A's data.

tests/test_cross_user_access.py proves it in-process. This proves it survives
the real server, real JWT parsing, and real Postgres RLS under a non-superuser
role.
"""

import pytest

from tests.e2e.support import assert_json, assert_problem

pytestmark = [pytest.mark.e2e, pytest.mark.django_db(transaction=True)]

RESOURCES = ["cycles", "daily-logs", "pregnancies", "profiles"]


@pytest.fixture
def alice_data(alice) -> dict[str, str]:
    """One object of each resource, owned by Alice. Values are ids."""
    client = alice.client
    cycle = client.post("/api/cycles/", json={"start_date": "2026-08-01"})
    log = client.post("/api/daily-logs/", json={"date": "2026-08-01", "symptoms": ["cramps"]})
    pregnancy = client.post("/api/pregnancies/", json={"due_date": "2027-05-01"})
    for response in (cycle, log, pregnancy):
        assert response.status_code == 201, response.text
    return {
        "cycles": assert_json(cycle)["id"],
        "daily-logs": assert_json(log)["id"],
        "pregnancies": assert_json(pregnancy)["id"],
        "profiles": assert_json(client.get("/api/profiles/"))["results"][0]["id"],
    }


@pytest.mark.parametrize("resource", RESOURCES)
def test_other_users_object_is_404_for_every_verb(alice, bob, alice_data, resource):
    url = f"/api/{resource}/{alice_data[resource]}/"
    assert alice.client.get(url).status_code == 200  # sanity: the owner sees it

    response = bob.client.get(url)
    assert response.status_code == 404, f"{response.status_code}: a 403 would leak existence"
    assert_problem(response, 404, "resource-not-found")
    assert bob.client.patch(url, json={"notes": "x"}).status_code == 404
    assert bob.client.put(url, json={"notes": "x"}).status_code == 404
    assert bob.client.delete(url).status_code in (404, 405)  # 405 where destroy is disabled

    assert alice.client.get(url).status_code == 200  # and it is untouched


@pytest.mark.parametrize("resource", ["cycles", "daily-logs", "pregnancies"])
def test_lists_only_contain_own_rows(alice, bob, alice_data, resource):
    assert assert_json(alice.client.get(f"/api/{resource}/"))["count"] == 1
    assert assert_json(bob.client.get(f"/api/{resource}/"))["count"] == 0


def test_profile_list_is_own_profile_only(alice, bob, alice_data):
    bobs = assert_json(bob.client.get("/api/profiles/"))
    assert bobs["count"] == 1
    assert bobs["results"][0]["id"] != alice_data["profiles"]


def test_client_cannot_choose_the_owner(alice, bob):
    """A `user` field in the payload is ignored; ownership comes from the token."""
    response = bob.client.post(
        "/api/cycles/", json={"start_date": "2026-08-15", "user": alice.id, "user_id": alice.id}
    )
    assert response.status_code == 201, response.text
    cycle = assert_json(response)
    assert "user" not in cycle
    assert bob.client.get(f"/api/cycles/{cycle['id']}/").status_code == 200
    assert alice.client.get(f"/api/cycles/{cycle['id']}/").status_code == 404
