import uuid
from datetime import datetime

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import OwnedQuerySet, TimestampedModel
from apps.payments.constants import ENTITLEMENT_PREMIUM


class Subscription(TimestampedModel):
    """
    User-level subscription and entitlement state projection for Happy Women.

    Synchronized via RevenueCat webhooks and API sync. Serves as the authoritative
    source of truth for premium access checks and API authorization.
    """

    class Status(models.TextChoices):
        FREE = "free", "Free"
        ACTIVE = "active", "Active"
        TRIALING = "trialing", "Trialing"
        CANCELLED = "cancelled", "Cancelled"
        PAST_DUE = "past_due", "Past Due"
        EXPIRED = "expired", "Expired"
        BILLING_ISSUE = "billing_issue", "Billing Issue"

    class Store(models.TextChoices):
        PLAY_STORE = "play_store", "Google Play Store"
        APP_STORE = "app_store", "Apple App Store"
        STRIPE = "stripe", "Stripe"
        PROMOTIONAL = "promotional", "Promotional"
        UNKNOWN = "unknown", "Unknown"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # OneToOne ensures exactly one canonical entitlement projection per user.
    # CASCADE cleans up billing projection when user deletes their account.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
        db_index=True,
    )

    # RevenueCat identity projection
    rc_app_user_id = models.CharField(
        max_length=255,
        db_index=True,
        blank=True,
        default="",
        help_text="RevenueCat App User ID (UUID string or account alias)",
    )

    # Product and entitlement configuration
    product_id = models.CharField(
        max_length=128,
        blank=True,
        default="",
        help_text="Store product identifier (e.g. premium_monthly, premium_annual)",
    )
    entitlement_id = models.CharField(
        max_length=64,
        default=ENTITLEMENT_PREMIUM,
        db_index=True,
        help_text="Canonical entitlement identifier",
    )

    # Subscription lifecycle state
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.FREE,
        db_index=True,
        help_text="Verified subscription lifecycle status",
    )
    is_active = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether premium entitlement access is currently granted",
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="UTC timestamp when subscription access expires",
    )

    # Origin and environment
    store = models.CharField(
        max_length=32,
        choices=Store.choices,
        default=Store.UNKNOWN,
        help_text="Payment store originating the subscription",
    )
    is_sandbox = models.BooleanField(
        default=False,
        help_text="True if purchase originated in test/sandbox environment",
    )

    # Synchronization tracking
    latest_event_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of latest relevant event from RevenueCat",
    )
    original_purchase_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when subscription was initially purchased",
    )
    last_synced_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of last successful sync with RevenueCat",
    )

    objects = OwnedQuerySet.as_manager()

    class Meta:
        db_table = "payments_subscription"
        indexes = [
            models.Index(fields=["user", "is_active"], name="idx_sub_user_active"),
            models.Index(fields=["status", "expires_at"], name="idx_sub_status_expires"),
        ]

    def __str__(self) -> str:
        return f"Subscription<{self.user_id}: {self.status}, active={self.is_active}>"

    def has_active_access(self, at: datetime | None = None) -> bool:
        """
        Check if the entitlement is currently active and within valid period.
        A cancelled subscription retains access until expires_at.
        """
        if not self.is_active:
            return False
        if self.expires_at is None:
            # Lifetime or open access
            return True
        now = at or timezone.now()
        return self.expires_at > now


class WebhookEvent(TimestampedModel):
    """
    RevenueCat webhook event ingestion journal.

    Maintains idempotency and provides an audit trail of received subscription events
    without storing complete raw payloads indefinitely.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSED = "processed", "Processed"
        FAILED = "failed", "Failed"
        IGNORED = "ignored", "Ignored"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_id = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Unique RevenueCat event ID for idempotency",
    )
    event_type = models.CharField(
        max_length=64,
        db_index=True,
        help_text="RevenueCat event type (e.g. INITIAL_PURCHASE, RENEWAL, CANCELLATION)",
    )
    app_user_id = models.CharField(
        max_length=255,
        db_index=True,
        blank=True,
        default="",
        help_text="App user ID referenced in the webhook payload",
    )
    event_timestamp = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of event occurrence reported by RevenueCat",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
        help_text="Processing status of this webhook event",
    )
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when event processing completed",
    )
    error_message = models.TextField(
        blank=True,
        default="",
        help_text="Sanitized error details if processing failed",
    )
    summary = models.JSONField(
        default=dict,
        blank=True,
        help_text="Minimal sanitized event metadata needed for troubleshooting",
    )

    class Meta:
        db_table = "payments_webhook_event"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["event_type", "status"], name="idx_webhook_type_status"),
            models.Index(fields=["app_user_id", "-created_at"], name="idx_webhook_user_created"),
        ]

    def __str__(self) -> str:
        return f"WebhookEvent<{self.event_id}: {self.event_type} [{self.status}]>"
