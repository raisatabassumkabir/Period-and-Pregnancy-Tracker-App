import datetime
from datetime import timezone

import pytest
from django.db import IntegrityError
from django.urls import reverse
from rest_framework.test import APIClient

from apps.core.rls import rls_bypass, rls_user
from apps.payments.constants import (
    ENTITLEMENT_PREMIUM,
    PRODUCT_PREMIUM_ANNUAL,
    PRODUCT_PREMIUM_MONTHLY,
    resolve_canonical_product_id,
)
from apps.payments.models import Subscription, WebhookEvent
from conftest import create_owned
from tests.factories import SubscriptionFactory, WebhookEventFactory

pytestmark = pytest.mark.django_db


class TestSubscriptionModel:
    def test_default_subscription_fields(self, user_a):
        with rls_user(str(user_a.pk)):
            sub = Subscription.objects.create(user=user_a)
            assert sub.status == Subscription.Status.FREE
            assert sub.is_active is False
            assert sub.entitlement_id == ENTITLEMENT_PREMIUM
            assert sub.expires_at is None
            assert sub.store == Subscription.Store.UNKNOWN
            assert sub.is_sandbox is False
            assert not sub.has_active_access()

    def test_one_to_one_constraint_per_user(self, user_a):
        from django.db import transaction

        with rls_bypass():
            Subscription.objects.create(user=user_a)
            with pytest.raises(IntegrityError), transaction.atomic():
                Subscription.objects.create(user=user_a)

    def test_user_deletion_cascades_subscription(self, user_a):
        sub = create_owned(SubscriptionFactory, user_a)
        sub_id = sub.pk

        with rls_bypass():
            assert Subscription.objects.filter(pk=sub_id).exists()
            user_a.delete()
            assert not Subscription.objects.filter(pk=sub_id).exists()

    def test_has_active_access_logic(self, user_a):
        now = datetime.datetime.now(timezone.utc)
        future = now + datetime.timedelta(days=15)
        past = now - datetime.timedelta(days=1)

        # Active with future expiration -> Active
        sub = create_owned(
            SubscriptionFactory,
            user_a,
            status=Subscription.Status.ACTIVE,
            is_active=True,
            expires_at=future,
        )
        assert sub.has_active_access(at=now) is True

        # Cancelled with future expiration -> STILL ACTIVE until expires_at
        sub.status = Subscription.Status.CANCELLED
        assert sub.has_active_access(at=now) is True

        # Cancelled with past expiration -> Not active
        sub.expires_at = past
        assert sub.has_active_access(at=now) is False

        # Inactive flag -> Not active regardless of dates
        sub.is_active = False
        sub.expires_at = future
        assert sub.has_active_access(at=now) is False

        # Open-ended lifetime active entitlement
        sub.is_active = True
        sub.expires_at = None
        assert sub.has_active_access(at=now) is True


class TestWebhookEventModel:
    def test_event_id_unique_idempotency_constraint(self):
        WebhookEventFactory(event_id="evt_unique_123")
        with pytest.raises(IntegrityError):
            WebhookEventFactory(event_id="evt_unique_123")

    def test_webhook_event_status_and_defaults(self):
        event = WebhookEvent.objects.create(
            event_id="rc_event_init_1",
            event_type="INITIAL_PURCHASE",
            app_user_id="user-uuid-abc",
            summary={"product_id": PRODUCT_PREMIUM_MONTHLY},
        )
        assert event.status == WebhookEvent.Status.PENDING
        assert event.created_at is not None
        assert event.processed_at is None
        assert event.error_message == ""
        assert event.summary["product_id"] == PRODUCT_PREMIUM_MONTHLY


class TestProductIdentifierHarmonization:
    def test_resolve_canonical_product_id(self):
        assert resolve_canonical_product_id("premium_monthly") == PRODUCT_PREMIUM_MONTHLY
        assert resolve_canonical_product_id("premium_annual") == PRODUCT_PREMIUM_ANNUAL
        # Legacy compatibility mapping
        assert resolve_canonical_product_id("premium_yearly") == PRODUCT_PREMIUM_ANNUAL
        assert resolve_canonical_product_id("") == ""


class TestSubscriptionStatusEndpoint:
    url = reverse("subscription-status")

    def test_unauthenticated_request_is_rejected(self):
        client = APIClient()
        response = client.get(self.url)
        assert response.status_code == 401

    def test_free_user_returns_free_status(self, user_a, as_user):
        client = as_user(user_a)
        response = client.get(self.url)
        assert response.status_code == 200

        data = response.json()
        assert data["is_premium"] is False
        assert data["subscription_status"] == "free"
        assert data["subscription_ends_at"] is None
        assert data["entitlement_id"] is None
        assert data["product_id"] is None
        assert data["store"] is None
        assert data["is_sandbox"] is False

    def test_active_subscriber_returns_active_status(self, user_a, as_user):
        future = datetime.datetime.now(timezone.utc) + datetime.timedelta(days=30)
        create_owned(
            SubscriptionFactory,
            user_a,
            status=Subscription.Status.ACTIVE,
            is_active=True,
            product_id=PRODUCT_PREMIUM_MONTHLY,
            store=Subscription.Store.PLAY_STORE,
            expires_at=future,
        )

        client = as_user(user_a)
        response = client.get(self.url)
        assert response.status_code == 200

        data = response.json()
        assert data["is_premium"] is True
        assert data["subscription_status"] == "active"
        assert data["product_id"] == PRODUCT_PREMIUM_MONTHLY
        assert data["entitlement_id"] == ENTITLEMENT_PREMIUM
        assert data["store"] == "play_store"
        assert data["subscription_ends_at"] is not None

    def test_cancelled_subscriber_retains_premium_until_expiration(self, user_a, as_user):
        future = datetime.datetime.now(timezone.utc) + datetime.timedelta(days=10)
        create_owned(
            SubscriptionFactory,
            user_a,
            status=Subscription.Status.CANCELLED,
            is_active=True,
            product_id=PRODUCT_PREMIUM_ANNUAL,
            expires_at=future,
        )

        client = as_user(user_a)
        response = client.get(self.url)
        assert response.status_code == 200

        data = response.json()
        # Active access remains true until period end
        assert data["is_premium"] is True
        assert data["subscription_status"] == "cancelled"
        assert data["subscription_ends_at"] is not None

    def test_expired_subscription_returns_expired_status(self, user_a, as_user):
        past = datetime.datetime.now(timezone.utc) - datetime.timedelta(days=2)
        create_owned(
            SubscriptionFactory,
            user_a,
            status=Subscription.Status.ACTIVE,
            is_active=True,
            product_id=PRODUCT_PREMIUM_MONTHLY,
            expires_at=past,
        )

        client = as_user(user_a)
        response = client.get(self.url)
        assert response.status_code == 200

        data = response.json()
        assert data["is_premium"] is False
        assert data["subscription_status"] == "expired"

    def test_cross_user_isolation(self, user_a, user_b, as_user):
        create_owned(
            SubscriptionFactory,
            user_a,
            status=Subscription.Status.ACTIVE,
            is_active=True,
        )

        # User B queries status — must see free, cannot see User A's premium status
        response_b = as_user(user_b).get(self.url)
        assert response_b.status_code == 200
        assert response_b.json()["is_premium"] is False
        assert response_b.json()["subscription_status"] == "free"

        # User A queries status — sees their own active premium status
        response_a = as_user(user_a).get(self.url)
        assert response_a.status_code == 200
        assert response_a.json()["is_premium"] is True

    def test_me_endpoint_reflects_subscription_status(self, user_a, as_user):
        client = as_user(user_a)
        res_free = client.get(reverse("user-me"))
        assert res_free.status_code == 200
        assert res_free.json()["is_premium"] is False

        create_owned(
            SubscriptionFactory,
            user_a,
            status=Subscription.Status.ACTIVE,
            is_active=True,
        )
        res_premium = client.get(reverse("user-me"))
        assert res_premium.status_code == 200
        assert res_premium.json()["is_premium"] is True

