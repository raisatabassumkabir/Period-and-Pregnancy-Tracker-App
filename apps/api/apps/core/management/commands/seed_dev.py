"""
Seed local development data: 3 user gmail accounts representing 3 different user modes
(cycle tracking, trying to conceive, and pregnancy) plus legacy demo users. Idempotent. Local/dev only.
"""

import datetime

from django.core.management.base import BaseCommand, CommandError

from apps.core.rls import rls_user
from apps.cycles.models import Cycle, DailyLog
from apps.pregnancy.models import Pregnancy
from apps.users.models import Profile, User


class Command(BaseCommand):
    help = "Seed demo users and health data for local development across 3 user modes."

    def handle(self, *args, **options):
        from django.conf import settings

        if not settings.DEBUG:
            raise CommandError("seed_dev refuses to run with DEBUG=False.")

        today = datetime.date.today()

        # -------------------------------------------------------------------------
        # 1. Mode: Cycle Tracking (cycle.tracker.demo@gmail.com)
        # -------------------------------------------------------------------------
        cycle_email = "cycle.tracker.demo@gmail.com"
        cycle_password = "CycleTrack2026!"
        user_cycle = self._user(cycle_email, cycle_password)
        with rls_user(str(user_cycle.pk)):
            Profile.objects.update_or_create(
                user=user_cycle,
                defaults={
                    "mode": Profile.Mode.CYCLE_TRACKING,
                    "country": "BD",
                    "language": "en",
                    "timezone": "Asia/Dhaka",
                    "diet": Profile.Diet.VEGETARIAN,
                    "budget_tier": Profile.BudgetTier.LOW,
                    "height": 162.5,
                    "weight": 56.0,
                    "medical_conditions": ["pcos"],
                    "goals": ["track_cycle", "manage_symptoms", "predict_period"],
                },
            )
            # Past cycles (28 days length)
            c1_start = today - datetime.timedelta(days=58)
            Cycle.objects.get_or_create(
                user=user_cycle,
                start_date=c1_start,
                defaults={"end_date": c1_start + datetime.timedelta(days=27)},
            )
            c2_start = today - datetime.timedelta(days=29)
            Cycle.objects.get_or_create(
                user=user_cycle,
                start_date=c2_start,
                defaults={"end_date": c2_start + datetime.timedelta(days=27)},
            )
            c3_start = today - datetime.timedelta(days=1)
            Cycle.objects.get_or_create(
                user=user_cycle,
                start_date=c3_start,
                defaults={"end_date": None},
            )
            # Daily logs
            for offset in range(-3, 1):
                log_date = today + datetime.timedelta(days=offset)
                DailyLog.objects.get_or_create(
                    user=user_cycle,
                    date=log_date,
                    defaults={
                        "flow": DailyLog.Flow.MEDIUM if offset < 0 else DailyLog.Flow.LIGHT,
                        "mood": DailyLog.Mood.LOW if offset < 0 else DailyLog.Mood.GOOD,
                        "symptoms": ["cramps", "fatigue", "bloating"],
                        "temperature_celsius": 36.5 + (offset * 0.1),
                        "notes": "Period started. Taking light rest.",
                    },
                )

        # -------------------------------------------------------------------------
        # 2. Mode: Trying to Conceive (ttc.tracker.demo@gmail.com)
        # -------------------------------------------------------------------------
        ttc_email = "ttc.tracker.demo@gmail.com"
        ttc_password = "TtcConceive2026!"
        user_ttc = self._user(ttc_email, ttc_password)
        with rls_user(str(user_ttc.pk)):
            Profile.objects.update_or_create(
                user=user_ttc,
                defaults={
                    "mode": Profile.Mode.TRYING_TO_CONCEIVE,
                    "country": "US",
                    "language": "en",
                    "timezone": "America/New_York",
                    "diet": Profile.Diet.OMNIVORE,
                    "budget_tier": Profile.BudgetTier.MEDIUM,
                    "height": 168.0,
                    "weight": 62.0,
                    "medical_conditions": ["irregular_cycle"],
                    "goals": ["track_ovulation", "maximize_fertility", "conceive"],
                },
            )
            # Past cycle and current fertile cycle
            ttc_c1_start = today - datetime.timedelta(days=40)
            Cycle.objects.get_or_create(
                user=user_ttc,
                start_date=ttc_c1_start,
                defaults={"end_date": ttc_c1_start + datetime.timedelta(days=28)},
            )
            ttc_c2_start = today - datetime.timedelta(days=12)
            Cycle.objects.get_or_create(
                user=user_ttc,
                start_date=ttc_c2_start,
                defaults={"end_date": None},
            )
            # Daily logs around ovulation
            for offset in range(-4, 1):
                log_date = today + datetime.timedelta(days=offset)
                DailyLog.objects.get_or_create(
                    user=user_ttc,
                    date=log_date,
                    defaults={
                        "flow": DailyLog.Flow.NONE,
                        "mood": DailyLog.Mood.GREAT,
                        "symptoms": ["ovulation_pain", "tender_breasts"],
                        "temperature_celsius": 36.4 if offset < -1 else 37.0,
                        "notes": "Ovulation test positive. Peak fertility window.",
                    },
                )

        # -------------------------------------------------------------------------
        # 3. Mode: Pregnancy (pregnancy.tracker.demo@gmail.com)
        # -------------------------------------------------------------------------
        preg_email = "pregnancy.tracker.demo@gmail.com"
        preg_password = "PregnancyCare2026!"
        user_preg = self._user(preg_email, preg_password)
        with rls_user(str(user_preg.pk)):
            Profile.objects.update_or_create(
                user=user_preg,
                defaults={
                    "mode": Profile.Mode.PREGNANCY,
                    "country": "DE",
                    "language": "en",
                    "timezone": "Europe/Berlin",
                    "diet": Profile.Diet.HALAL,
                    "budget_tier": Profile.BudgetTier.HIGH,
                    "height": 170.0,
                    "weight": 68.5,
                    "medical_conditions": [],
                    "goals": ["track_baby_growth", "prepare_birth", "monitor_health"],
                },
            )
            lmp_date = today - datetime.timedelta(days=120)  # ~17 weeks
            due_date = lmp_date + datetime.timedelta(days=280)
            Pregnancy.objects.get_or_create(
                user=user_preg,
                status=Pregnancy.Status.ACTIVE,
                defaults={
                    "lmp_date": lmp_date,
                    "due_date": due_date,
                    "notes": "Second trimester. Baby healthy and active.",
                },
            )
            for offset in range(-2, 1):
                log_date = today + datetime.timedelta(days=offset)
                DailyLog.objects.get_or_create(
                    user=user_preg,
                    date=log_date,
                    defaults={
                        "flow": DailyLog.Flow.NONE,
                        "mood": DailyLog.Mood.GREAT if offset == 0 else DailyLog.Mood.GOOD,
                        "symptoms": ["back_pain", "food_cravings"],
                        "temperature_celsius": None,
                        "notes": "Felt first light fetal kicks! Staying hydrated.",
                    },
                )

        # Legacy demo users (for backward compatibility)
        legacy_pass = "demo-password-123"
        legacy_cycle = self._user("cycle@demo.local", legacy_pass)
        with rls_user(str(legacy_cycle.pk)):
            Profile.objects.get_or_create(
                user=legacy_cycle,
                defaults={
                    "country": "BD",
                    "language": "bn",
                    "diet": Profile.Diet.VEGETARIAN,
                    "budget_tier": Profile.BudgetTier.LOW,
                    "medical_conditions": ["pcos"],
                },
            )
        legacy_preg = self._user("pregnancy@demo.local", legacy_pass)
        with rls_user(str(legacy_preg.pk)):
            Profile.objects.get_or_create(
                user=legacy_preg,
                defaults={"mode": Profile.Mode.PREGNANCY, "country": "DE", "language": "en"},
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded 3 Gmail user accounts across 3 modes (Cycle Tracking, TTC, Pregnancy)."))
        self.stdout.write(self.style.SUCCESS(f"1. Cycle Tracking: {cycle_email} / Password: {cycle_password}"))
        self.stdout.write(self.style.SUCCESS(f"2. Trying to Conceive: {ttc_email} / Password: {ttc_password}"))
        self.stdout.write(self.style.SUCCESS(f"3. Pregnancy: {preg_email} / Password: {preg_password}"))

    def _user(self, email, password):
        user = User.objects.filter(email=email).first()
        if user is None:
            user = User.objects.create_user(email=email, password=password)
        else:
            user.set_password(password)
            user.save()
        return user

