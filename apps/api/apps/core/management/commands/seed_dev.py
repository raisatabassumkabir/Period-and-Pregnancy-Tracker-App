"""
Seed local development data: two demo users, cycles with daily logs, and a
pregnancy. Idempotent. Local/dev only.
"""

import datetime

from django.core.management.base import BaseCommand, CommandError

from apps.core.rls import rls_user
from apps.cycles.models import Cycle, DailyLog
from apps.pregnancy.models import Pregnancy
from apps.users.models import Profile, User


class Command(BaseCommand):
    help = "Seed demo users and health data for local development."

    def handle(self, *args, **options):
        from django.conf import settings

        if not settings.DEBUG:
            raise CommandError("seed_dev refuses to run with DEBUG=False.")

        demo_password = "demo-password-123"

        cycle_user = self._user("cycle@demo.local", demo_password)
        with rls_user(str(cycle_user.pk)):
            Profile.objects.get_or_create(
                user=cycle_user,
                defaults={
                    "country": "BD",
                    "language": "bn",
                    "diet": Profile.Diet.VEGETARIAN,
                    "budget_tier": Profile.BudgetTier.LOW,
                    "medical_conditions": ["pcos"],
                },
            )
            start = datetime.date(2026, 6, 1)
            for i in range(3):
                cycle_start = start + datetime.timedelta(days=29 * i)
                Cycle.objects.get_or_create(
                    user=cycle_user,
                    start_date=cycle_start,
                    defaults={"end_date": cycle_start + datetime.timedelta(days=28)},
                )
                for offset in range(4):
                    DailyLog.objects.get_or_create(
                        user=cycle_user,
                        date=cycle_start + datetime.timedelta(days=offset),
                        defaults={
                            "flow": DailyLog.Flow.MEDIUM if offset < 3 else DailyLog.Flow.LIGHT,
                            "symptoms": ["cramps", "fatigue"],
                        },
                    )

        pregnant_user = self._user("pregnancy@demo.local", demo_password)
        with rls_user(str(pregnant_user.pk)):
            Profile.objects.get_or_create(
                user=pregnant_user,
                defaults={"mode": Profile.Mode.PREGNANCY, "country": "DE", "language": "en"},
            )
            Pregnancy.objects.get_or_create(
                user=pregnant_user,
                status=Pregnancy.Status.ACTIVE,
                defaults={
                    "lmp_date": datetime.date(2026, 5, 15),
                    "due_date": datetime.date(2027, 2, 19),
                },
            )

        self.stdout.write(self.style.SUCCESS(f"Seeded. Demo password: {demo_password}"))

    def _user(self, email, password):
        user = User.objects.filter(email=email).first()
        if user is None:
            user = User.objects.create_user(email=email, password=password)
        return user
