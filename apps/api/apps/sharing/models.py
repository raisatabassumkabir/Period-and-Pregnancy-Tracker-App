"""
Partner sharing (ARCHITECTURE §6).

A partner never gets a database path to her health tables. What they can read
is `SharedStatus`: date anchors derived from her cycles/pregnancy, enough for
the partner's app to work out "period in 3 days" or "fertile window" locally.
No symptoms, mood, notes, intercourse logs or screening results, ever. If you
are about to add such a field here, stop and raise it first.

RLS (migration 0001):
- PartnerInvite: owner policy, plus a `redeem` policy that exposes one row
  only to a transaction that already knows its code (`app.invite_code_hash`).
- PartnerLink: visible to both people in it.
- SharedStatus: owner policy, plus read-only access for her linked partner.
"""

import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.core.models import OwnedModel, OwnedQuerySet, TimestampedModel


class PartnerInvite(OwnedModel):
    """A one-time code she shares with her partner. `user` is her."""

    # SHA-256 of the normalised code; the code itself is never stored.
    code_hash = models.CharField(max_length=64, unique=True)
    display_name = models.CharField(max_length=40, blank=True, default="")
    expires_at = models.DateTimeField()
    redeemed_at = models.DateTimeField(null=True, blank=True)

    objects = OwnedQuerySet.as_manager()


class PartnerLinkQuerySet(models.QuerySet):
    def for_user(self, user):
        """Links where the user is either side. Fails closed like OwnedQuerySet."""
        if user is None or not getattr(user, "is_authenticated", False):
            return self.none()
        return self.filter(Q(owner=user) | Q(partner=user))


class PartnerLink(TimestampedModel):
    """She (owner) shares a narrow status with one partner. Delete = unlink, effective now."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="partner_link_as_owner"
    )
    partner = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="partner_link_as_partner"
    )
    owner_name = models.CharField(max_length=40, blank=True, default="")
    partner_name = models.CharField(max_length=40, blank=True, default="")
    share_fertile_window = models.BooleanField(default=True)
    share_pregnancy = models.BooleanField(default=True)

    objects = PartnerLinkQuerySet.as_manager()

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=~Q(owner=models.F("partner")), name="partnerlink_not_self"
            ),
        ]


class SharedStatusQuerySet(models.QuerySet):
    def visible_to(self, user):
        """Her own row, or the row of the person who linked this user as partner."""
        if user is None or not getattr(user, "is_authenticated", False):
            return self.none()
        return self.filter(Q(user=user) | Q(user__partner_link_as_owner__partner=user))


class SharedStatus(OwnedModel):
    """
    The ONLY thing a partner can read. `user` is her; one row per user.

    Deliberately no `for_user()`: readers are her OR her partner, so access
    goes through `visible_to()`, mirrored by the `partner_read` RLS policy.
    """

    mode = models.CharField(max_length=32)
    cycle_length = models.PositiveIntegerField(default=28)
    period_length = models.PositiveIntegerField(default=5)
    last_period_start = models.DateField(null=True, blank=True)
    next_period_date = models.DateField(null=True, blank=True)
    ovulation_date = models.DateField(null=True, blank=True)
    pregnancy_due_date = models.DateField(null=True, blank=True)

    objects = SharedStatusQuerySet.as_manager()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user"], name="uniq_sharedstatus_user"),
        ]
