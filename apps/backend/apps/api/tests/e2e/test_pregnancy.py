"""Pregnancy journeys: one active at a time, gestational week from LMP."""

import datetime

import pytest

from tests.e2e.support import assert_json, assert_problem

pytestmark = [pytest.mark.e2e, pytest.mark.django_db(transaction=True)]


def test_pregnancy_lifecycle(alice):
    client = alice.client
    lmp = datetime.date.today() - datetime.timedelta(days=70)
    due = lmp + datetime.timedelta(days=280)

    response = client.post(
        "/api/pregnancies/", json={"lmp_date": lmp.isoformat(), "due_date": due.isoformat()}
    )
    assert response.status_code == 201, response.text
    pregnancy = assert_json(response)
    assert pregnancy["status"] == "active"
    # 70 days is week 11; allow a day of date skew between this process and the server.
    assert pregnancy["current_week"] in (10, 11, 12)

    # A second active pregnancy is a 409 conflict, not a 500 from the partial unique constraint.
    response = client.post("/api/pregnancies/", json={"due_date": due.isoformat()})
    assert "status" in assert_problem(response, 409, "resource-conflict")["errors"]

    # current_week is derived and read-only.
    response = client.patch(f"/api/pregnancies/{pregnancy['id']}/", json={"current_week": 40})
    assert response.status_code == 200
    assert assert_json(response)["current_week"] == pregnancy["current_week"]

    # Ending it frees the slot.
    response = client.patch(f"/api/pregnancies/{pregnancy['id']}/", json={"status": "completed"})
    assert response.status_code == 200
    response = client.post("/api/pregnancies/", json={"due_date": due.isoformat()})
    assert response.status_code == 201, response.text
    assert assert_json(client.get("/api/pregnancies/"))["count"] == 2

    assert client.delete(f"/api/pregnancies/{pregnancy['id']}/").status_code == 204
    assert client.get(f"/api/pregnancies/{pregnancy['id']}/").status_code == 404


def test_current_week_is_null_before_conception_date(alice):
    due = datetime.date.today() + datetime.timedelta(days=300)
    response = alice.client.post("/api/pregnancies/", json={"due_date": due.isoformat()})
    assert response.status_code == 201, response.text
    assert assert_json(response)["current_week"] is None


def test_due_date_is_required(alice):
    response = alice.client.post("/api/pregnancies/", json={})
    assert "due_date" in assert_problem(response, 422, "validation-failed")["errors"]
