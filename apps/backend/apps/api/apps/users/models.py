import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.core.models import OwnedQuerySet, TimestampedModel
from apps.users.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Email-based login, UUID primary key.

    The UUID pk is load-bearing for security: the RLS policies cast
    `app.user_id` to uuid, and UUIDs in URLs are unguessable. `users_user`
    itself carries no RLS — it holds credentials, not health data, and auth
    has to read it before any user context exists.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        swappable = "AUTH_USER_MODEL"

    def __str__(self):
        return self.email


class Profile(TimestampedModel):
    """
    Localization and personalization context — this is what lets the AI
    assistant tailor answers to, e.g., a 27-year-old in Bangladesh with PCOS
    on a low-budget vegetarian diet.

    `medical_conditions` makes this a health-data table, so it gets RLS in the
    initial migration exactly like the clinical tables.
    """

    class Mode(models.TextChoices):
        CYCLE_TRACKING = "cycle_tracking", "Cycle tracking"
        TRYING_TO_CONCEIVE = "trying_to_conceive", "Trying to conceive"
        PREGNANCY = "pregnancy", "Pregnancy"
        POSTPARTUM = "postpartum", "Postpartum"

    class Diet(models.TextChoices):
        UNSPECIFIED = "unspecified", "Unspecified"
        OMNIVORE = "omnivore", "Omnivore"
        VEGETARIAN = "vegetarian", "Vegetarian"
        VEGAN = "vegan", "Vegan"
        PESCATARIAN = "pescatarian", "Pescatarian"
        HALAL = "halal", "Halal"
        KOSHER = "kosher", "Kosher"

    class BudgetTier(models.TextChoices):
        UNSPECIFIED = "unspecified", "Unspecified"
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # OneToOne rather than OwnedModel's FK, but the column is still `user_id`
    # so the standard RLS owner policy applies unchanged.
    user = models.OneToOneField("users.User", on_delete=models.CASCADE, related_name="profile")

    mode = models.CharField(max_length=32, choices=Mode.choices, default=Mode.CYCLE_TRACKING)
    date_of_birth = models.DateField(null=True, blank=True)

    # Localization: ISO 3166-1 alpha-2 country, BCP 47 language tag, IANA tz.
    country = models.CharField(max_length=2, blank=True, default="")
    language = models.CharField(max_length=12, default="en")
    timezone = models.CharField(max_length=64, default="UTC")

    diet = models.CharField(max_length=16, choices=Diet.choices, default=Diet.UNSPECIFIED)
    budget_tier = models.CharField(
        max_length=16, choices=BudgetTier.choices, default=BudgetTier.UNSPECIFIED
    )

    height = models.FloatField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    average_cycle_length = models.PositiveIntegerField(default=28, blank=True)
    average_period_duration = models.PositiveIntegerField(default=5, blank=True)
    goals = models.JSONField(default=list, blank=True)
    source = models.CharField(max_length=64, blank=True, default="")

    # Values validated against apps.core.constants.CONDITION_TAXONOMY in the
    # serializer (e.g. ["pcos"]). JSONB: read whole, filtered rarely.
    medical_conditions = models.JSONField(default=list, blank=True)

    objects = OwnedQuerySet.as_manager()

    class Meta:
        db_table = "users_profile"

    def __str__(self):
        return f"Profile<{self.user_id}>"
