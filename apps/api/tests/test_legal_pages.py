"""
Public legal pages: Play requires a reachable privacy policy and a web route
for account deletion, so they must load without auth and name a contact.
"""

import pytest
from django.test import Client
from django.urls import reverse

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    ("route", "heading"),
    [
        ("legal-privacy", b"Privacy policy"),
        ("legal-terms", b"Terms of service"),
        ("legal-account-deletion", b"Delete your Happy Women account"),
    ],
)
def test_legal_page_is_public_html_with_contact(route, heading, settings):
    settings.SUPPORT_EMAIL = "privacy@happywomen.test"

    response = Client().get(reverse(route))

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/html")
    assert heading in response.content
    assert b"privacy@happywomen.test" in response.content


def test_privacy_policy_states_backup_retention(settings):
    settings.BACKUP_RETENTION_DAYS = 30

    response = Client().get(reverse("legal-privacy"))

    assert b"kept for 30 days" in response.content
