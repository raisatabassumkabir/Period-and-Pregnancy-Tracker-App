import json
import logging
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import dateparse, timezone

from apps.core.rls import rls_bypass, rls_user
from apps.payments.constants import (
    ENTITLEMENT_PREMIUM,
    resolve_canonical_product_id,
)
from apps.payments.exceptions import (
    RevenueCatAuthenticationError,
    RevenueCatClientError,
    RevenueCatConfigurationError,
    RevenueCatNetworkError,
    RevenueCatServiceError,
)
from apps.payments.models import Subscription, WebhookEvent

logger = logging.getLogger(__name__)
User = get_user_model()


def parse_iso_datetime(value: Any) -> datetime | None:
    """Safely parse an ISO-8601 or millisecond timestamp into a timezone-aware UTC datetime."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value if timezone.is_aware(value) else timezone.make_aware(value)
    if isinstance(value, (int, float)):
        # RevenueCat millisecond timestamp
        return datetime.fromtimestamp(value / 1000.0, tz=timezone.utc)
    if isinstance(value, str):
        parsed = dateparse.parse_datetime(value)
        if parsed:
            return parsed if timezone.is_aware(parsed) else timezone.make_aware(parsed)
    return None


def fetch_revenuecat_subscriber(app_user_id: str) -> dict[str, Any]:
    """
    Fetch subscriber customer info directly from RevenueCat's REST API.

    API: GET /v1/subscribers/{app_user_id}
    Doc: https://www.revenuecat.com/docs/api-v1/customers
    """
    api_key = getattr(settings, "REVENUECAT_SECRET_API_KEY", "")
    if not api_key:
        raise RevenueCatConfigurationError("REVENUECAT_SECRET_API_KEY is not configured.")

    base_url = getattr(
        settings, "REVENUECAT_API_BASE_URL", "https://api.revenuecat.com/v1"
    ).rstrip("/")
    quoted_id = urllib.parse.quote(str(app_user_id), safe="")
    url = f"{base_url}/subscribers/{quoted_id}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "User-Agent": "HappyWomen-API/1.0",
    }

    req = urllib.request.Request(url, headers=headers, method="GET")
    timeout = getattr(settings, "REVENUECAT_REQUEST_TIMEOUT_SECONDS", 8)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            data = json.loads(body)
            return data.get("subscriber", {})
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            # User has no RevenueCat history yet; return empty subscriber object
            return {"entitlements": {}, "subscriptions": {}}
        if exc.code in (401, 403):
            raise RevenueCatAuthenticationError(
                f"RevenueCat API authorization rejected [HTTP {exc.code}]."
            ) from exc
        if exc.code == 429 or exc.code >= 500:
            raise RevenueCatServiceError(
                f"RevenueCat service error [HTTP {exc.code}]."
            ) from exc
        raise RevenueCatClientError(f"RevenueCat client error [HTTP {exc.code}].") from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise RevenueCatNetworkError(f"RevenueCat request failed: {exc}") from exc


def map_store_string(store_str: str | None) -> str:
    """Normalize store strings from RevenueCat into Subscription.Store choices."""
    if not store_str:
        return Subscription.Store.UNKNOWN
    store_lower = store_str.lower()
    if "play_store" in store_lower or "google" in store_lower:
        return Subscription.Store.PLAY_STORE
    if "app_store" in store_lower or "apple" in store_lower:
        return Subscription.Store.APP_STORE
    if "stripe" in store_lower:
        return Subscription.Store.STRIPE
    if "promotional" in store_lower:
        return Subscription.Store.PROMOTIONAL
    return Subscription.Store.UNKNOWN


def reconcile_subscription_state(
    user: Any,
    subscriber_data: dict[str, Any],
    event_timestamp: datetime | None = None,
) -> Subscription:
    """
    Evaluate RevenueCat customer state and transactionally update the Subscription projection.

    Evaluates:
      - Active subscriptions.
      - Cancelled subscriptions retaining access until expiration.
      - Active trials.
      - Billing grace periods.
      - Expired or revoked entitlements.
    """
    now = timezone.now()
    entitlements = subscriber_data.get("entitlements", {})
    premium_ent = entitlements.get(ENTITLEMENT_PREMIUM)

    # Determine entitlement status
    if not premium_ent:
        is_active = False
        status = Subscription.Status.FREE
        expires_at = None
        product_id = ""
        store = Subscription.Store.UNKNOWN
        is_sandbox = False
        original_purchase_at = None
    else:
        product_raw = premium_ent.get("product_identifier", "")
        product_id = resolve_canonical_product_id(product_raw)
        store = map_store_string(premium_ent.get("store"))
        is_sandbox = bool(premium_ent.get("is_sandbox", False))

        raw_expires_at = parse_iso_datetime(premium_ent.get("expires_date"))
        grace_period_expires_at = parse_iso_datetime(
            premium_ent.get("grace_period_expires_date")
        )
        unsubscribe_detected_at = parse_iso_datetime(
            premium_ent.get("unsubscribe_detected_at")
        )
        billing_issues_detected_at = parse_iso_datetime(
            premium_ent.get("billing_issues_detected_at")
        )
        original_purchase_at = parse_iso_datetime(
            premium_ent.get("purchase_date")
            or premium_ent.get("original_purchase_date")
        )

        # Grace period extends access during billing recovery
        effective_expires_at = grace_period_expires_at or raw_expires_at

        # Check if entitlement is currently within valid window
        if effective_expires_at is None:
            # Lifetime access grant
            is_valid_period = True
        else:
            is_valid_period = effective_expires_at > now

        expires_at = effective_expires_at

        if not is_valid_period:
            is_active = False
            status = Subscription.Status.EXPIRED
        else:
            is_active = True
            if billing_issues_detected_at:
                status = Subscription.Status.BILLING_ISSUE
            elif unsubscribe_detected_at:
                status = Subscription.Status.CANCELLED
            else:
                # Check period_type from subscriptions list if available
                sub_meta = subscriber_data.get("subscriptions", {}).get(product_raw, {})
                period_type = sub_meta.get("period_type", "")
                if period_type == "trial":
                    status = Subscription.Status.TRIALING
                else:
                    status = Subscription.Status.ACTIVE

    # Apply database update inside transaction and RLS scope
    with transaction.atomic(), rls_user(str(user.pk)):
        sub, _created = Subscription.objects.select_for_update().get_or_create(
            user=user,
            defaults={
                "rc_app_user_id": str(user.id),
                "entitlement_id": ENTITLEMENT_PREMIUM,
            },
        )

        sub.rc_app_user_id = str(user.id)
        sub.entitlement_id = ENTITLEMENT_PREMIUM
        sub.product_id = product_id
        sub.status = status
        sub.is_active = is_active
        sub.expires_at = expires_at
        sub.store = store
        sub.is_sandbox = is_sandbox
        sub.last_synced_at = now
        if event_timestamp:
            sub.latest_event_at = event_timestamp
        if original_purchase_at and not sub.original_purchase_at:
            sub.original_purchase_at = original_purchase_at

        sub.save()
        return sub


def sync_user_subscription(user: Any) -> tuple[Subscription, str | None]:
    """
    Synchronize the authenticated user's subscription directly against RevenueCat.
    Returns (Subscription, warning_message).
    """
    app_user_id = str(user.id)
    warning = None

    try:
        subscriber_data = fetch_revenuecat_subscriber(app_user_id)
        subscription = reconcile_subscription_state(user, subscriber_data)
        return subscription, None
    except RevenueCatConfigurationError as exc:
        logger.warning("RevenueCat configuration missing during sync: %s", exc)
        warning = "Subscription service credentials not configured."
    except RevenueCatNetworkError as exc:
        logger.warning("RevenueCat network error during sync for %s: %s", app_user_id, exc)
        warning = "Unable to reach subscription verification service. Please retry."
    except RevenueCatServiceError as exc:
        logger.warning("RevenueCat upstream error during sync for %s: %s", app_user_id, exc)
        warning = "Subscription provider temporarily unavailable."
    except Exception as exc:
        logger.error("Unexpected error during subscription sync: %s", exc, exc_info=True)
        warning = "Subscription synchronization encountered an error."

    # In case of service error, return existing local projection without granting false premium
    with rls_user(str(user.pk)):
        sub = Subscription.objects.for_user(user).first()
        if not sub:
            sub = Subscription.objects.create(
                user=user,
                rc_app_user_id=app_user_id,
                status=Subscription.Status.FREE,
                is_active=False,
            )
        return sub, warning


def resolve_user_from_app_user_id(app_user_id: str) -> Any | None:
    """
    Safely resolve a Django User from a RevenueCat app_user_id.
    Ensures webhooks never map to arbitrary or non-existent accounts.
    """
    if not app_user_id:
        return None

    # 1. Primary identity convention: app_user_id is the user's UUID
    try:
        user_uuid = uuid.UUID(str(app_user_id))
        with rls_bypass():
            user = User.objects.filter(id=user_uuid).first()
            if user:
                return user
    except (ValueError, TypeError):
        pass

    # 2. Secondary resolution: check if a known Subscription projection already references this ID
    with rls_bypass():
        sub = Subscription.objects.filter(rc_app_user_id=str(app_user_id)).first()
        if sub and sub.user:
            return sub.user

    return None


def process_webhook_event_record(webhook_event: WebhookEvent) -> tuple[bool, str]:
    """
    Process a received WebhookEvent record idempotently.
    Updates the Subscription projection and marks event as PROCESSED or FAILED.
    """
    summary = webhook_event.summary or {}
    event_type = webhook_event.event_type
    app_user_id = webhook_event.app_user_id
    event_timestamp = webhook_event.event_timestamp or timezone.now()

    # Handle TRANSFER events explicitly
    if event_type == "TRANSFER":
        transferred_from = summary.get("transferred_from", [])
        transferred_to = summary.get("transferred_to", [])

        with transaction.atomic(), rls_bypass():
            # Deactivate source user entitlements
            for old_id in transferred_from:
                old_user = resolve_user_from_app_user_id(old_id)
                if old_user:
                    Subscription.objects.filter(user=old_user).update(
                        is_active=False,
                        status=Subscription.Status.CANCELLED,
                        last_synced_at=timezone.now(),
                    )

            # Reconcile target user
            for new_id in transferred_to:
                target_user = resolve_user_from_app_user_id(new_id)
                if target_user:
                    try:
                        subscriber_data = fetch_revenuecat_subscriber(new_id)
                        reconcile_subscription_state(
                            target_user, subscriber_data, event_timestamp=event_timestamp
                        )
                    except Exception as exc:
                        logger.warning("Failed to reconcile transferred user %s: %s", new_id, exc)

        webhook_event.status = WebhookEvent.Status.PROCESSED
        webhook_event.processed_at = timezone.now()
        webhook_event.save(update_fields=["status", "processed_at", "updated_at"])
        return True, "Transfer processed successfully."

    # For standard events, resolve target user
    user = resolve_user_from_app_user_id(app_user_id)
    if not user:
        # Identity cannot be determined; ignore safely without granting arbitrary access
        msg = f"No internal user matches app_user_id '{app_user_id}'."
        webhook_event.status = WebhookEvent.Status.IGNORED
        webhook_event.error_message = msg
        webhook_event.processed_at = timezone.now()
        webhook_event.save(
            update_fields=["status", "error_message", "processed_at", "updated_at"]
        )
        return True, msg

    try:
        # Reconcile against authoritative RevenueCat subscriber state
        subscriber_data = fetch_revenuecat_subscriber(str(user.id))
        reconcile_subscription_state(
            user, subscriber_data, event_timestamp=event_timestamp
        )

        webhook_event.status = WebhookEvent.Status.PROCESSED
        webhook_event.processed_at = timezone.now()
        webhook_event.error_message = ""
        webhook_event.save(
            update_fields=["status", "processed_at", "error_message", "updated_at"]
        )
        return True, "Processed successfully."
    except Exception as exc:
        err_msg = f"Reconciliation error: {exc}"
        logger.error(
            "Webhook processing failed for event %s: %s",
            webhook_event.event_id,
            exc,
            exc_info=True,
        )
        webhook_event.status = WebhookEvent.Status.FAILED
        webhook_event.error_message = err_msg[:500]
        webhook_event.save(
            update_fields=["status", "error_message", "updated_at"]
        )
        return False, err_msg
