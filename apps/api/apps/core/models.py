"""
Base models for the whole API.

Security layer 1 lives here: `OwnedQuerySet.for_user()` is the ONLY way views
may scope data. Views never call `.objects.all()` or bare `.objects.filter()`
(scripts/lint_owned_queries.py enforces this in CI). Layer 2 is Postgres RLS,
applied in each app's initial migration.
"""

import uuid

from django.conf import settings
from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class OwnedQuerySet(models.QuerySet):
    """
    Queryset for user-owned rows.

    `for_user()` fails closed: an anonymous or missing user yields an empty
    queryset, never an unfiltered one. Because views build everything on top of
    this queryset, DRF's `get_object()` raises Http404 for another user's pk —
    a 404, not a 403, so we never confirm that the object exists (RULE 3).
    """

    def for_user(self, user):
        if user is None or not getattr(user, "is_authenticated", False):
            return self.none()
        return self.filter(user=user)


class OwnedModel(TimestampedModel):
    """
    Abstract base for every user-owned table.

    UUID primary keys: sequential integer ids leak volume information and make
    object-id guessing trivial. The `user` FK column is named `user_id`, which
    is exactly what the RLS policies compare against `app.user_id`.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)s_set",
        db_index=True,
    )

    objects = OwnedQuerySet.as_manager()

    class Meta:
        abstract = True
