import datetime
import json
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError, URLError

import pytest
from celery.exceptions import Retry
from django.conf import settings
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from apps.core.rls import rls_bypass, rls_user
from apps.payments.constants import (
    ENTITLEMENT_PREMIUM,
    PRODUCT_PREMIUM_ANNUAL,
    PRODUCT_PREMIUM_MONTHLY,
)
from apps.payments.exceptions import (
    RevenueCatAuthenticationError,
    RevenueCatNetworkError,
    RevenueCatServiceError,
)
from apps.payments.models import Subscription, WebhookEvent
from apps.payments.services import (
    fetch_revenuecat_subscriber,
    process_webhook_event_record,
    reconcile_subscription_state,
    sync_user_subscription,
)
from apps.payments.tasks import EVENT_NOT_VISIBLE_RETRY_SECONDS, process_revenuecat_event
from conftest import create_owned
from tests.factories import SubscriptionFactory, WebhookEventFactory

pytestmark = pytest.mark.django_db


# -------------------------------------------------------------------------
# Helpers to construct RevenueCat mock subscriber responses
# -------------------------------------------------------------------------


def build_rc_subscriber(
    entitlement_id=ENTITLEMENT_PREMIUM,
    product_id=PRODUCT_PREMIUM_MONTHLY,
    expires_date=None,
    grace_period_expires_date=None,
    unsubscribe_detected_at=None,
    billing_issues_detected_at=None,
    period_type="normal",
    is_sandbox=False,
    store="play_store",
):
    if expires_date is None:
        future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
        expires_date = future.isoformat()

    entitlements = {}
    subscriptions = {}

    if entitlement_id:
        entitlements[entitlement_id] = {
            "expires_date": expires_date,
            "grace_period_expires_date": grace_period_expires_date,
            "product_identifier": product_id,
            "purchase_date": "2026-01-01T00:00:00Z",
            "store": store,
            "is_sandbox": is_sandbox,
            "unsubscribe_detected_at": unsubscribe_detected_at,
            "billing_issues_detected_at": billing_issues_detected_at,
        }
        subscriptions[product_id] = {
            "expires_date": expires_date,
            "period_type": period_type,
            "purchase_date": "2026-01-01T00:00:00Z",
            "store": store,
            "is_sandbox": is_sandbox,
            "unsubscribe_detected_at": unsubscribe_detected_at,
            "billing_issues_detected_at": billing_issues_detected_at,
        }

    return {
        "entitlements": entitlements,
        "subscriptions": subscriptions,
    }


# =========================================================================
# 1. Webhook Security & Ingestion Tests
# =========================================================================


class TestRevenueCatWebhookSecurity:
    url = reverse("revenuecat-webhook")

    def test_missing_authorization_header(self):
        client = APIClient()
        response = client.post(
            self.url,
            {"event": {"id": "evt_1", "type": "INITIAL_PURCHASE"}},
            format="json",
        )
        assert response.status_code == 401
        assert "Invalid or missing" in response.json()["detail"]

    def test_invalid_authorization_secret(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer wrong-secret-token")
        response = client.post(
            self.url,
            {"event": {"id": "evt_1", "type": "INITIAL_PURCHASE"}},
            format="json",
        )
        assert response.status_code == 401
        assert "Invalid or missing" in response.json()["detail"]

    @patch("apps.payments.views.process_revenuecat_event.delay")
    def test_valid_authorization_secret_accepts_event(
        self, mock_delay, user_a, django_capture_on_commit_callbacks
    ):
        client = APIClient()
        secret = getattr(settings, "REVENUECAT_WEBHOOK_AUTHORIZATION", "test_webhook_secret")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {secret}")

        payload = {
            "event": {
                "id": "evt_valid_123",
                "type": "INITIAL_PURCHASE",
                "app_user_id": str(user_a.id),
                "product_id": PRODUCT_PREMIUM_MONTHLY,
                "entitlement_id": ENTITLEMENT_PREMIUM,
            }
        }
        with django_capture_on_commit_callbacks(execute=True):
            response = client.post(self.url, payload, format="json")
        assert response.status_code == 200
        assert response.json()["status"] == "accepted"
        assert response.json()["event_id"] == "evt_valid_123"

        # Verify event was persisted
        event = WebhookEvent.objects.filter(event_id="evt_valid_123").first()
        assert event is not None
        assert event.event_type == "INITIAL_PURCHASE"
        assert event.app_user_id == str(user_a.id)
        mock_delay.assert_called_once_with(event_id="evt_valid_123")

    @patch("apps.payments.views.process_revenuecat_event.delay")
    @override_settings(
        REVENUECAT_WEBHOOK_AUTHORIZATION="",
        REVENUECAT_WEBHOOK_SECRET="legacy_secret_999",
    )
    def test_legacy_webhook_secret_fallback_accepted(self, mock_delay, user_a):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer legacy_secret_999")
        payload = {
            "event": {
                "id": "evt_legacy_secret_1",
                "type": "INITIAL_PURCHASE",
                "app_user_id": str(user_a.id),
                "product_id": PRODUCT_PREMIUM_MONTHLY,
            }
        }
        response = client.post(self.url, payload, format="json")
        assert response.status_code == 200
        assert response.json()["status"] == "accepted"
        assert response.json()["event_id"] == "evt_legacy_secret_1"

    def test_malformed_json_payload(self):
        client = APIClient()
        secret = getattr(settings, "REVENUECAT_WEBHOOK_AUTHORIZATION", "test_webhook_secret")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {secret}")

        response = client.post(
            self.url,
            data="not-a-json-string{",
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "Malformed JSON" in response.json()["detail"]

    def test_missing_event_dictionary(self):
        client = APIClient()
        secret = getattr(settings, "REVENUECAT_WEBHOOK_AUTHORIZATION", "test_webhook_secret")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {secret}")

        response = client.post(self.url, {"foo": "bar"}, format="json")
        assert response.status_code == 400
        assert "Missing 'event' dictionary" in response.json()["detail"]

    def test_missing_event_id_or_type(self):
        client = APIClient()
        secret = getattr(settings, "REVENUECAT_WEBHOOK_AUTHORIZATION", "test_webhook_secret")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {secret}")

        response = client.post(
            self.url,
            {"event": {"id": "evt_only"}},
            format="json",
        )
        assert response.status_code == 400
        assert "must contain 'id' and 'type'" in response.json()["detail"]

    @patch("apps.payments.views.process_revenuecat_event.delay")
    def test_unknown_event_type_is_accepted_safely(
        self, mock_delay, user_a, django_capture_on_commit_callbacks
    ):
        client = APIClient()
        secret = getattr(settings, "REVENUECAT_WEBHOOK_AUTHORIZATION", "test_webhook_secret")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {secret}")

        payload = {
            "event": {
                "id": "evt_unknown_999",
                "type": "FUTURE_UNSUPPORTED_TYPE",
                "app_user_id": str(user_a.id),
            }
        }
        with django_capture_on_commit_callbacks(execute=True):
            response = client.post(self.url, payload, format="json")
        assert response.status_code == 200
        assert response.json()["status"] == "accepted"
        mock_delay.assert_called_once_with(event_id="evt_unknown_999")


    @patch("apps.payments.views.process_revenuecat_event.delay")
    def test_task_is_enqueued_only_after_commit(
        self, mock_delay, user_a, django_capture_on_commit_callbacks
    ):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {settings.REVENUECAT_WEBHOOK_AUTHORIZATION}")
        payload = {
            "event": {
                "id": "evt_after_commit_1",
                "type": "INITIAL_PURCHASE",
                "app_user_id": str(user_a.id),
            }
        }

        with django_capture_on_commit_callbacks() as callbacks:
            response = client.post(self.url, payload, format="json")
            # The row is not committed yet, so the worker must not see the job.
            mock_delay.assert_not_called()

        assert response.status_code == 200
        assert len(callbacks) == 1
        callbacks[0]()
        mock_delay.assert_called_once_with(event_id="evt_after_commit_1")


# =========================================================================
# 2. Webhook Idempotency & Processing Tests
# =========================================================================


class TestRevenueCatWebhookIdempotency:
    url = reverse("revenuecat-webhook")

    @patch("apps.payments.views.process_revenuecat_event.delay")
    def test_duplicate_processed_event_returns_already_processed(self, mock_delay, user_a):
        WebhookEventFactory(
            event_id="evt_duplicate_1",
            status=WebhookEvent.Status.PROCESSED,
            app_user_id=str(user_a.id),
        )

        client = APIClient()
        secret = getattr(settings, "REVENUECAT_WEBHOOK_AUTHORIZATION", "test_webhook_secret")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {secret}")

        payload = {
            "event": {
                "id": "evt_duplicate_1",
                "type": "RENEWAL",
                "app_user_id": str(user_a.id),
            }
        }
        response = client.post(self.url, payload, format="json")
        assert response.status_code == 200
        assert response.json()["status"] == "already_processed"
        assert response.json()["event_id"] == "evt_duplicate_1"
        # Task must not be dispatched again for already processed event
        mock_delay.assert_not_called()

    @patch("apps.payments.views.process_revenuecat_event.delay")
    def test_redelivery_of_pending_or_failed_event_triggers_task(
        self, mock_delay, user_a, django_capture_on_commit_callbacks
    ):
        WebhookEventFactory(
            event_id="evt_retry_1",
            status=WebhookEvent.Status.FAILED,
            app_user_id=str(user_a.id),
        )

        client = APIClient()
        secret = getattr(settings, "REVENUECAT_WEBHOOK_AUTHORIZATION", "test_webhook_secret")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {secret}")

        payload = {
            "event": {
                "id": "evt_retry_1",
                "type": "RENEWAL",
                "app_user_id": str(user_a.id),
            }
        }
        with django_capture_on_commit_callbacks(execute=True):
            response = client.post(self.url, payload, format="json")
        assert response.status_code == 200
        assert response.json()["status"] == "accepted"
        mock_delay.assert_called_once_with(event_id="evt_retry_1")

    @patch("apps.payments.services.fetch_revenuecat_subscriber")
    def test_unknown_app_user_id_ignored_without_arbitrary_access(self, mock_fetch):
        event = WebhookEventFactory(
            event_id="evt_unmapped_user",
            event_type="INITIAL_PURCHASE",
            app_user_id="00000000-0000-0000-0000-000000000099",
        )
        success, message = process_webhook_event_record(event)
        assert success is True
        assert "No internal user matches" in message

        event.refresh_from_db()
        assert event.status == WebhookEvent.Status.IGNORED
        # External API should never have been queried for unknown user
        mock_fetch.assert_not_called()

    @patch("apps.payments.services.fetch_revenuecat_subscriber")
    def test_transfer_event_moves_entitlement(self, mock_fetch, user_a, user_b):
        create_owned(
            SubscriptionFactory,
            user_a,
            status=Subscription.Status.ACTIVE,
            is_active=True,
        )

        future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
        mock_fetch.return_value = build_rc_subscriber(
            product_id=PRODUCT_PREMIUM_ANNUAL,
            expires_date=future.isoformat(),
        )

        event = WebhookEventFactory(
            event_id="evt_transfer_1",
            event_type="TRANSFER",
            app_user_id=str(user_b.id),
            summary={
                "transferred_from": [str(user_a.id)],
                "transferred_to": [str(user_b.id)],
            },
        )

        success, _msg = process_webhook_event_record(event)
        assert success is True

        event.refresh_from_db()
        assert event.status == WebhookEvent.Status.PROCESSED

        with rls_bypass():
            sub_a = Subscription.objects.get(user=user_a)
            sub_b = Subscription.objects.get(user=user_b)
            assert sub_a.is_active is False
            assert sub_a.status == Subscription.Status.CANCELLED
            assert sub_b.is_active is True
            assert sub_b.status == Subscription.Status.ACTIVE


# =========================================================================
# 3. Subscription Reconciliation Tests
# =========================================================================


class TestSubscriptionReconciliation:
    def test_active_monthly_entitlement(self, user_a):
        future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=25)
        data = build_rc_subscriber(
            product_id=PRODUCT_PREMIUM_MONTHLY,
            expires_date=future.isoformat(),
            store="play_store",
        )

        sub = reconcile_subscription_state(user_a, data)
        assert sub.is_active is True
        assert sub.status == Subscription.Status.ACTIVE
        assert sub.product_id == PRODUCT_PREMIUM_MONTHLY
        assert sub.store == Subscription.Store.PLAY_STORE
        assert sub.has_active_access() is True

    def test_active_annual_entitlement(self, user_a):
        future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=360)
        data = build_rc_subscriber(
            product_id=PRODUCT_PREMIUM_ANNUAL,
            expires_date=future.isoformat(),
            store="play_store",
        )

        sub = reconcile_subscription_state(user_a, data)
        assert sub.is_active is True
        assert sub.status == Subscription.Status.ACTIVE
        assert sub.product_id == PRODUCT_PREMIUM_ANNUAL
        assert sub.has_active_access() is True

    def test_active_trial_entitlement(self, user_a):
        future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        data = build_rc_subscriber(
            product_id=PRODUCT_PREMIUM_MONTHLY,
            expires_date=future.isoformat(),
            period_type="trial",
        )

        sub = reconcile_subscription_state(user_a, data)
        assert sub.is_active is True
        assert sub.status == Subscription.Status.TRIALING
        assert sub.has_active_access() is True

    def test_cancelled_retains_access_until_expiration(self, user_a):
        now = datetime.datetime.now(datetime.timezone.utc)
        future = now + datetime.timedelta(days=12)
        past = now - datetime.timedelta(days=1)

        # Cancelled with future expiration date
        data = build_rc_subscriber(
            product_id=PRODUCT_PREMIUM_MONTHLY,
            expires_date=future.isoformat(),
            unsubscribe_detected_at=past.isoformat(),
        )

        sub = reconcile_subscription_state(user_a, data)
        assert sub.is_active is True
        assert sub.status == Subscription.Status.CANCELLED
        # Entitlement has active access until paid through date
        assert sub.has_active_access(at=now) is True

    def test_expired_entitlement_loses_access(self, user_a):
        now = datetime.datetime.now(datetime.timezone.utc)
        past = now - datetime.timedelta(days=3)

        data = build_rc_subscriber(
            product_id=PRODUCT_PREMIUM_MONTHLY,
            expires_date=past.isoformat(),
        )

        sub = reconcile_subscription_state(user_a, data)
        assert sub.is_active is False
        assert sub.status == Subscription.Status.EXPIRED
        assert sub.has_active_access(at=now) is False

    def test_billing_grace_period_extends_access(self, user_a):
        now = datetime.datetime.now(datetime.timezone.utc)
        past_expire = now - datetime.timedelta(days=1)
        future_grace = now + datetime.timedelta(days=5)

        data = build_rc_subscriber(
            product_id=PRODUCT_PREMIUM_MONTHLY,
            expires_date=past_expire.isoformat(),
            grace_period_expires_date=future_grace.isoformat(),
            billing_issues_detected_at=past_expire.isoformat(),
        )

        sub = reconcile_subscription_state(user_a, data)
        assert sub.is_active is True
        assert sub.status == Subscription.Status.BILLING_ISSUE
        assert sub.expires_at == future_grace
        assert sub.has_active_access(at=now) is True

    def test_missing_or_revoked_premium_entitlement(self, user_a):
        # Entitlement dictionary contains no "premium" key
        data = {"entitlements": {}, "subscriptions": {}}

        sub = reconcile_subscription_state(user_a, data)
        assert sub.is_active is False
        assert sub.status == Subscription.Status.FREE
        assert sub.has_active_access() is False

    @patch("apps.payments.services.fetch_revenuecat_subscriber")
    def test_network_failure_falls_back_to_local_projection(self, mock_fetch, user_a):
        # Existing local projection
        create_owned(
            SubscriptionFactory,
            user_a,
            status=Subscription.Status.FREE,
            is_active=False,
        )

        mock_fetch.side_effect = RevenueCatNetworkError("Connection timed out")
        sub, warning = sync_user_subscription(user_a)

        assert sub.is_active is False
        assert sub.status == Subscription.Status.FREE
        assert warning is not None
        assert "Unable to reach" in warning

    @patch("apps.payments.services.fetch_revenuecat_subscriber")
    def test_service_error_preserves_projection_without_false_grant(self, mock_fetch, user_a):
        create_owned(
            SubscriptionFactory,
            user_a,
            status=Subscription.Status.FREE,
            is_active=False,
        )

        mock_fetch.side_effect = RevenueCatServiceError("500 Internal Server Error")
        sub, warning = sync_user_subscription(user_a)

        assert sub.is_active is False
        assert warning is not None
        assert "temporarily unavailable" in warning


# =========================================================================
# 4. Authenticated Subscription Sync Endpoint Tests
# =========================================================================


class TestSubscriptionSyncEndpoint:
    url = reverse("subscription-sync")

    def test_sync_unauthenticated_rejected(self):
        client = APIClient()
        response = client.post(self.url, {})
        assert response.status_code == 401

    @patch("apps.payments.services.fetch_revenuecat_subscriber")
    def test_sync_authenticated_user_derives_identity_from_session(
        self, mock_fetch, user_a, as_user
    ):
        future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
        mock_fetch.return_value = build_rc_subscriber(
            product_id=PRODUCT_PREMIUM_MONTHLY,
            expires_date=future.isoformat(),
        )

        client = as_user(user_a)
        response = client.post(self.url, {})
        assert response.status_code == 200

        data = response.json()
        assert data["is_premium"] is True
        assert data["subscription_status"] == "active"
        assert data["product_id"] == PRODUCT_PREMIUM_MONTHLY
        assert data["entitlement_id"] == ENTITLEMENT_PREMIUM
        assert data["warning"] is None

        # Verify fetch was called with user_a's UUID
        mock_fetch.assert_called_once_with(str(user_a.id))

    @patch("apps.payments.services.fetch_revenuecat_subscriber")
    def test_sync_ignores_client_supplied_user_id(
        self, mock_fetch, user_a, user_b, as_user
    ):
        future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
        mock_fetch.return_value = build_rc_subscriber(
            product_id=PRODUCT_PREMIUM_MONTHLY,
            expires_date=future.isoformat(),
        )

        client = as_user(user_a)
        # Attempt to pass user_b's ID in body
        response = client.post(self.url, {"app_user_id": str(user_b.id)})
        assert response.status_code == 200

        # Verified: backend MUST call RevenueCat with user_a's ID, ignoring user_b
        mock_fetch.assert_called_once_with(str(user_a.id))

    @patch("apps.payments.services.fetch_revenuecat_subscriber")
    def test_sync_fallback_when_revenuecat_unavailable(self, mock_fetch, user_a, as_user):
        mock_fetch.side_effect = RevenueCatServiceError("RC 503")

        client = as_user(user_a)
        response = client.post(self.url, {})
        assert response.status_code == 200

        data = response.json()
        assert data["is_premium"] is False
        assert data["subscription_status"] == "free"
        assert data["warning"] is not None


# =========================================================================
# 5. Deprecated Verify Purchase Endpoint Tests
# =========================================================================


class TestDeprecatedVerifyPurchaseEndpoint:
    url = reverse("verify-purchase")

    def test_deprecated_endpoint_returns_410_gone(self, user_a, as_user):
        client = as_user(user_a)
        payload = {
            "purchase_token": "mock-token-abc",
            "package_name": "com.happywomen.tracker",
            "product_id": PRODUCT_PREMIUM_MONTHLY,
        }
        response = client.post(self.url, payload, format="json")
        assert response.status_code == 410

        data = response.json()
        assert data["status"] == 410
        assert data["is_premium"] is False
        assert "deprecated" in data["detail"].lower()

    def test_deprecated_endpoint_never_grants_premium(self, user_a, as_user):
        client = as_user(user_a)
        client.post(self.url, {"product_id": PRODUCT_PREMIUM_ANNUAL})

        # Subscription in database must not be marked premium
        with rls_user(str(user_a.pk)):
            sub = Subscription.objects.for_user(user_a).first()
            if sub:
                assert sub.is_active is False
                assert sub.status == Subscription.Status.FREE


# =========================================================================
# 6. Low-Level HTTP Client & Celery Task Tests
# =========================================================================


class TestRevenueCatHttpClient:
    @patch("urllib.request.urlopen")
    def test_fetch_subscriber_success(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(
            {"subscriber": {"entitlements": {ENTITLEMENT_PREMIUM: {}}}}
        ).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        data = fetch_revenuecat_subscriber("user-uuid-123")
        assert ENTITLEMENT_PREMIUM in data["entitlements"]

    @patch("urllib.request.urlopen")
    def test_fetch_subscriber_404_returns_empty_dict(self, mock_urlopen):
        error = HTTPError("https://api.revenuecat.com", 404, "Not Found", {}, None)
        mock_urlopen.side_effect = error

        data = fetch_revenuecat_subscriber("new-user-with-no-history")
        assert data == {"entitlements": {}, "subscriptions": {}}

    @patch("urllib.request.urlopen")
    def test_fetch_subscriber_401_raises_auth_error(self, mock_urlopen):
        error = HTTPError("https://api.revenuecat.com", 401, "Unauthorized", {}, None)
        mock_urlopen.side_effect = error

        with pytest.raises(RevenueCatAuthenticationError):
            fetch_revenuecat_subscriber("user-uuid-123")

    @patch("urllib.request.urlopen")
    def test_fetch_subscriber_500_raises_service_error(self, mock_urlopen):
        error = HTTPError("https://api.revenuecat.com", 500, "Server Error", {}, None)
        mock_urlopen.side_effect = error

        with pytest.raises(RevenueCatServiceError):
            fetch_revenuecat_subscriber("user-uuid-123")

    @patch("urllib.request.urlopen")
    def test_fetch_subscriber_timeout_raises_network_error(self, mock_urlopen):
        mock_urlopen.side_effect = URLError("timed out")

        with pytest.raises(RevenueCatNetworkError):
            fetch_revenuecat_subscriber("user-uuid-123")


class TestCeleryTaskExecution:
    def test_celery_task_retries_when_event_not_yet_visible(self):
        with patch.object(process_revenuecat_event, "retry", side_effect=Retry()) as retry:
            with pytest.raises(Retry):
                process_revenuecat_event.run("evt_not_committed_yet")

        retry.assert_called_once_with(countdown=EVENT_NOT_VISIBLE_RETRY_SECONDS)

    @patch("apps.payments.services.fetch_revenuecat_subscriber")
    def test_celery_task_processes_valid_event(self, mock_fetch, user_a):
        future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
        mock_fetch.return_value = build_rc_subscriber(
            product_id=PRODUCT_PREMIUM_MONTHLY,
            expires_date=future.isoformat(),
        )

        event = WebhookEventFactory(
            event_id="evt_celery_valid_1",
            event_type="INITIAL_PURCHASE",
            app_user_id=str(user_a.id),
        )

        res = process_revenuecat_event.apply(args=[event.event_id]).get()
        assert res is True

        event.refresh_from_db()
        assert event.status == WebhookEvent.Status.PROCESSED
        assert event.processed_at is not None

        with rls_user(str(user_a.pk)):
            sub = Subscription.objects.for_user(user_a).first()
            assert sub is not None
            assert sub.is_active is True
            assert sub.status == Subscription.Status.ACTIVE
