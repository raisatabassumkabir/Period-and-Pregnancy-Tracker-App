import datetime

import factory

from apps.cycles.models import Cycle, DailyLog
from apps.payments.constants import ENTITLEMENT_PREMIUM, PRODUCT_PREMIUM_MONTHLY
from apps.payments.models import Subscription, WebhookEvent
from apps.pregnancy.models import Pregnancy
from apps.users.models import Profile, User


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    password = factory.django.Password("test-password-123")


class ProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Profile

    user = factory.SubFactory(UserFactory)
    country = "BD"
    language = "bn"
    diet = Profile.Diet.VEGETARIAN
    budget_tier = Profile.BudgetTier.LOW
    medical_conditions = ["pcos"]


class CycleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Cycle

    user = factory.SubFactory(UserFactory)
    start_date = factory.Sequence(
        lambda n: datetime.date(2026, 1, 1) + datetime.timedelta(days=28 * n)
    )


class DailyLogFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DailyLog

    user = factory.SubFactory(UserFactory)
    date = factory.Sequence(lambda n: datetime.date(2026, 1, 1) + datetime.timedelta(days=n))
    flow = DailyLog.Flow.MEDIUM
    symptoms = ["cramps", "fatigue"]


class PregnancyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Pregnancy

    user = factory.SubFactory(UserFactory)
    lmp_date = datetime.date(2026, 6, 1)
    due_date = datetime.date(2027, 3, 8)


class SubscriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Subscription

    user = factory.SubFactory(UserFactory)
    rc_app_user_id = factory.LazyAttribute(lambda o: str(o.user.id))
    product_id = PRODUCT_PREMIUM_MONTHLY
    entitlement_id = ENTITLEMENT_PREMIUM
    status = Subscription.Status.ACTIVE
    is_active = True
    store = Subscription.Store.PLAY_STORE
    is_sandbox = False
    expires_at = factory.LazyFunction(
        lambda: datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
    )


class WebhookEventFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = WebhookEvent

    event_id = factory.Sequence(lambda n: f"rc_event_{n}")
    event_type = "INITIAL_PURCHASE"
    status = WebhookEvent.Status.PENDING
    summary = factory.LazyFunction(dict)

