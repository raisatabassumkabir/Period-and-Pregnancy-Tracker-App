"""Cycle and daily-log journeys for one user."""

import pytest

from tests.e2e.support import assert_json, assert_problem

pytestmark = [pytest.mark.e2e, pytest.mark.django_db(transaction=True)]


def test_cycle_lifecycle(alice):
    client = alice.client

    response = client.post("/api/cycles/", json={"start_date": "2026-06-01"})
    assert response.status_code == 201, response.text
    cycle = assert_json(response)
    assert cycle["end_date"] is None
    assert "user" not in cycle

    page = assert_json(client.get("/api/cycles/"))
    assert page["count"] == 1
    assert page["results"][0]["id"] == cycle["id"]

    response = client.patch(f"/api/cycles/{cycle['id']}/", json={"end_date": "2026-06-29"})
    assert response.status_code == 200, response.text
    assert assert_json(response)["end_date"] == "2026-06-29"

    response = client.patch(f"/api/cycles/{cycle['id']}/", json={"end_date": "2026-05-01"})
    assert_problem(response, 422, "validation-failed")

    assert client.delete(f"/api/cycles/{cycle['id']}/").status_code == 204
    assert client.get(f"/api/cycles/{cycle['id']}/").status_code == 404
    assert assert_json(client.get("/api/cycles/"))["count"] == 0


def test_duplicate_cycle_start_date_is_409_not_500(alice):
    client = alice.client
    assert client.post("/api/cycles/", json={"start_date": "2026-07-01"}).status_code == 201
    response = client.post("/api/cycles/", json={"start_date": "2026-07-01"})
    assert "start_date" in assert_problem(response, 409, "resource-conflict")["errors"]


def test_cycles_are_listed_newest_first(alice):
    client = alice.client
    for start in ["2026-01-01", "2026-03-01", "2026-02-01"]:
        assert client.post("/api/cycles/", json={"start_date": start}).status_code == 201
    dates = [row["start_date"] for row in assert_json(client.get("/api/cycles/"))["results"]]
    assert dates == ["2026-03-01", "2026-02-01", "2026-01-01"]


def test_daily_log_lifecycle(alice):
    client = alice.client

    response = client.post(
        "/api/daily-logs/",
        json={
            "date": "2026-09-01",
            "flow": "medium",
            "mood": "low",
            "symptoms": ["fatigue", "cramps", "cramps"],
            "temperature_celsius": "36.60",
        },
    )
    assert response.status_code == 201, response.text
    log = assert_json(response)
    assert log["symptoms"] == ["cramps", "fatigue"]  # deduped and sorted
    assert log["temperature_celsius"] == "36.60"

    response = client.patch(f"/api/daily-logs/{log['id']}/", json={"mood": "good", "symptoms": []})
    assert response.status_code == 200, response.text
    assert assert_json(response)["mood"] == "good"

    assert client.delete(f"/api/daily-logs/{log['id']}/").status_code == 204
    assert client.get(f"/api/daily-logs/{log['id']}/").status_code == 404


def test_one_daily_log_per_date(alice):
    client = alice.client
    assert client.post("/api/daily-logs/", json={"date": "2026-09-02"}).status_code == 201
    response = client.post("/api/daily-logs/", json={"date": "2026-09-02"})
    assert "date" in assert_problem(response, 409, "resource-conflict")["errors"]


@pytest.mark.parametrize(
    "payload,field",
    [
        ({"date": "2026-09-03", "symptoms": ["telepathy"]}, "symptoms"),
        ({"date": "2026-09-03", "symptoms": "cramps"}, "symptoms"),
        ({"date": "2026-09-03", "flow": "tsunami"}, "flow"),
        ({"date": "not-a-date"}, "date"),
        ({}, "date"),
    ],
)
def test_invalid_daily_log_is_422(alice, payload, field):
    response = alice.client.post("/api/daily-logs/", json=payload)
    body = assert_problem(response, 422, "validation-failed")
    assert field in body["errors"]
    # Health values never come back in an error body (rule 5).
    for value in payload.values():
        if isinstance(value, list):
            assert not any(str(v) in response.text for v in value)
