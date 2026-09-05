import datetime

import factory

from apps.cycles.models import Cycle, DailyLog
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
