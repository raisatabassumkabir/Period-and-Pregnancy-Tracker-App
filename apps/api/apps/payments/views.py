import json
import logging
import secrets

from django.conf import settings
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.models import Subscription, WebhookEvent
from apps.payments.services import (
    parse_iso_datetime,
    sync_user_subscription,
)
from apps.payments.tasks import process_revenuecat_event

logger = logging.getLogger(__name__)


class SubscriptionStatusView(APIView):
    """
    Authoritative subscription status endpoint for Happy Women.

    Returns the user's current subscription projection, including entitlement status,
    active state, and store metadata according to CONTRACT.md.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        subscription = Subscription.objects.for_user(request.user).first()

        if subscription is None:
            return Response(
                {
                    "is_premium": False,
                    "subscription_status": Subscription.Status.FREE,
                    "subscription_ends_at": None,
                    "entitlement_id": None,
                    "product_id": None,
                    "store": None,
                    "is_sandbox": False,
                    "last_synced_at": None,
                    "warning": None,
                },
                status=status.HTTP_200_OK,
            )

        # A cancelled subscription remains premium until its expiration date.
        has_access = subscription.has_active_access()

        # If a non-free subscription has expired, reflect expired status
        effective_status = subscription.status
        if not has_access and subscription.status in (
            Subscription.Status.ACTIVE,
            Subscription.Status.CANCELLED,
            Subscription.Status.TRIALING,
        ):
            effective_status = Subscription.Status.EXPIRED

        return Response(
            {
                "is_premium": has_access,
                "subscription_status": effective_status,
                "subscription_ends_at": (
                    subscription.expires_at.isoformat()
                    if subscription.expires_at
                    else None
                ),
                "entitlement_id": subscription.entitlement_id,
                "product_id": subscription.product_id or None,
                "store": subscription.store,
                "is_sandbox": subscription.is_sandbox,
                "last_synced_at": (
                    subscription.last_synced_at.isoformat()
                    if subscription.last_synced_at
                    else None
                ),
                "warning": None,
            },
            status=status.HTTP_200_OK,
        )


class SubscriptionSyncView(APIView):
    """
    Synchronizes the authenticated user's subscription against RevenueCat.

    Derives the RevenueCat App User ID strictly from the authenticated user's
    internal UUID (`request.user.id`). Never trusts client-supplied user identifiers.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        subscription, warning = sync_user_subscription(request.user)

        has_access = subscription.has_active_access()
        effective_status = subscription.status
        if not has_access and subscription.status in (
            Subscription.Status.ACTIVE,
            Subscription.Status.CANCELLED,
            Subscription.Status.TRIALING,
        ):
            effective_status = Subscription.Status.EXPIRED

        return Response(
            {
                "is_premium": has_access,
                "subscription_status": effective_status,
                "subscription_ends_at": (
                    subscription.expires_at.isoformat()
                    if subscription.expires_at
                    else None
                ),
                "entitlement_id": subscription.entitlement_id,
                "product_id": subscription.product_id or None,
                "store": subscription.store,
                "is_sandbox": subscription.is_sandbox,
                "last_synced_at": (
                    subscription.last_synced_at.isoformat()
                    if subscription.last_synced_at
                    else None
                ),
                "warning": warning,
            },
            status=status.HTTP_200_OK,
        )


class RevenueCatWebhookView(APIView):
    """
    Inbound webhook endpoint for RevenueCat subscription lifecycle events.

    Authenticates via configured authorization secret, persists event for idempotency,
    and enqueues background reconciliation task via Celery.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    # RevenueCat redelivers in bursts from a few IPs; the shared secret is the gate.
    throttle_classes = []

    def post(self, request):
        # 1. Constant-time authentication check (canonical: REVENUECAT_WEBHOOK_AUTHORIZATION)
        expected_secret = getattr(
            settings, "REVENUECAT_WEBHOOK_AUTHORIZATION", ""
        ) or getattr(settings, "REVENUECAT_WEBHOOK_SECRET", "")
        auth_header = request.headers.get("Authorization") or request.META.get(
            "HTTP_AUTHORIZATION", ""
        )
        token = auth_header.replace("Bearer ", "").strip() if auth_header else ""

        if not expected_secret or not token or not secrets.compare_digest(token, expected_secret):
            return Response(
                {"detail": "Invalid or missing webhook authorization credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 2. Parse and validate JSON payload
        try:
            payload = (
                request.data
                if isinstance(request.data, dict)
                else json.loads(request.body.decode("utf-8"))
            )
        except Exception:
            return Response(
                {"detail": "Malformed JSON payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event = payload.get("event")
        if not isinstance(event, dict):
            return Response(
                {"detail": "Missing 'event' dictionary in payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_id = event.get("id")
        event_type = event.get("type")
        app_user_id = event.get("app_user_id", "")

        if not event_id or not event_type:
            return Response(
                {"detail": "Event must contain 'id' and 'type' fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Idempotent event persistence
        event_timestamp = parse_iso_datetime(
            event.get("event_timestamp_ms")
            or event.get("purchased_at_ms")
            or event.get("event_timestamp")
        )

        summary = {
            "product_id": event.get("product_id"),
            "entitlement_id": event.get("entitlement_id"),
            "period_type": event.get("period_type"),
            "store": event.get("store"),
            "environment": event.get("environment"),
            "transferred_from": event.get("transferred_from", []),
            "transferred_to": event.get("transferred_to", []),
        }

        webhook_event, created = WebhookEvent.objects.get_or_create(
            event_id=event_id,
            defaults={
                "event_type": event_type,
                "app_user_id": app_user_id,
                "event_timestamp": event_timestamp,
                "status": WebhookEvent.Status.PENDING,
                "summary": summary,
            },
        )

        if not created and webhook_event.status == WebhookEvent.Status.PROCESSED:
            # Already processed; acknowledge promptly
            return Response(
                {"status": "already_processed", "event_id": event_id},
                status=status.HTTP_200_OK,
            )

        # 4. Dispatch only after RLSMiddleware's transaction commits; otherwise the
        # worker can run before the WebhookEvent row is visible and drop the event.
        transaction.on_commit(lambda: process_revenuecat_event.delay(event_id=event_id))

        return Response(
            {"status": "accepted", "event_id": event_id},
            status=status.HTTP_200_OK,
        )


class DeprecatedVerifyPurchaseView(APIView):
    """
    Deprecated Google Play direct verification endpoint.

    Replaced by RevenueCat synchronization (`POST /api/v1/payments/subscription-sync/`).
    Returns an explicit, safe deprecation response and never grants unverified premium access.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response(
            {
                "type": "https://apiguide.dev/errors/deprecated-endpoint",
                "title": "Endpoint Deprecated",
                "status": status.HTTP_410_GONE,
                "detail": (
                    "Direct Google Play receipt verification has been deprecated. "
                    "Purchases are managed via RevenueCat and synchronized via "
                    "POST /api/v1/payments/subscription-sync/."
                ),
                "is_premium": False,
                "subscription_status": "free",
                "subscription_ends_at": None,
            },
            status=status.HTTP_410_GONE,
        )
