"""
Real server accounts for the demo logins the mobile app offers on its login
screen (apps/mobile/src/lib/auth/demo-users.ts). With these, a demo login goes
through the same API as a real user, so testing a demo account tests the real
backend: cycles, pregnancy, partner sharing.

Data mirrors the app's offline seed (apps/mobile/src/lib/health/demo-seed.ts),
relative to today, so screens look the same online and offline. Idempotent:
each run resets these accounts, including any partner links between them.
Local/dev only.

Usage: uv run manage.py seed_demo_accounts
"""

import datetime
from dataclasses import dataclass

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q

from apps.core.rls import rls_bypass, rls_user
from apps.cycles.models import Cycle, DailyLog
from apps.cycles.services import calculate_cycle_projections
from apps.pregnancy.models import Pregnancy
from apps.sharing.models import PartnerInvite, PartnerLink
from apps.sharing.services import refresh_shared_status
from apps.users.models import Profile, User

# Must match DEMO_PASSWORD / CLEAN_TEST_PASSWORD in demo-users.ts.
DEMO_PASSWORD = "Password123!"
CLEAN_TEST_PASSWORD = "HappyWomen2026!"

PERIOD_LENGTH_DAYS = 5
GESTATION_DAYS = 280
# Week 18 the way the app counts it: floor(elapsed / 7) + 1 (demo-seed.ts).
PREGNANCY_LMP_DAYS_AGO = 17 * 7 + 2


@dataclass(frozen=True)
class DemoAccount:
    email: str
    password: str
    profile: dict | None = None
    cycle_starts_days_ago: tuple[int, ...] = ()
    pregnant: bool = False


def _profile(mode: str, dob: str, height: float, weight: float, **overrides) -> dict:
    return {
        "mode": mode,
        "date_of_birth": datetime.date.fromisoformat(dob),
        "height": height,
        "weight": weight,
        "language": "en",
        "average_cycle_length": 28,
        "average_period_duration": PERIOD_LENGTH_DAYS,
        "medical_conditions": [],
        **overrides,
    }


ACCOUNTS = (
    DemoAccount(
        "claire.cycle@gmail.com",
        DEMO_PASSWORD,
        _profile(Profile.Mode.CYCLE_TRACKING, "1999-04-15", 165, 58, goals=["sync_sex_life"]),
        cycle_starts_days_ago=(10, 38, 66),  # gaps equal the 28-day profile
    ),
    DemoAccount(
        "sarah.pregnancy@gmail.com",
        DEMO_PASSWORD,
        _profile(Profile.Mode.PREGNANCY, "1996-08-20", 168, 64),
        pregnant=True,
    ),
    DemoAccount(
        "maya.pcos@gmail.com",
        DEMO_PASSWORD,
        _profile(
            Profile.Mode.CYCLE_TRACKING,
            "1998-01-12",
            162,
            61,
            average_cycle_length=32,
            medical_conditions=["pcos"],
        ),
        cycle_starts_days_ago=(10, 42, 74),  # gaps equal the 32-day profile
    ),
    # Partner POV: an account with a profile and no health data of its own.
    DemoAccount(
        "daniel.partner@gmail.com",
        DEMO_PASSWORD,
        _profile(Profile.Mode.CYCLE_TRACKING, "1997-02-03", 178, 76),
    ),
    # Clean slate: no profile at all, so the app runs onboarding.
    DemoAccount("test1@happywomen.com", CLEAN_TEST_PASSWORD),
    DemoAccount("test2@happywomen.com", CLEAN_TEST_PASSWORD),
    DemoAccount("test3@happywomen.com", CLEAN_TEST_PASSWORD),
)


class Command(BaseCommand):
    help = "Create or reset the app's demo logins as real accounts (local/dev only)."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_demo_accounts refuses to run with DEBUG=False.")
        today = datetime.date.today()
        users = [self._seed(account, today) for account in ACCOUNTS]
        self._clear_partner_sharing(users)
        self.stdout.write(self.style.SUCCESS("Demo accounts ready:"))
        for account in ACCOUNTS:
            self.stdout.write(f"  {account.email} / {account.password}")

    def _seed(self, account: DemoAccount, today: datetime.date) -> User:
        user = User.objects.filter(email=account.email).first()
        if user is None:
            user = User.objects.create_user(email=account.email, password=account.password)
        else:
            user.set_password(account.password)
            user.is_active = True
            user.save()
        with transaction.atomic(), rls_user(str(user.pk)):
            self._reset_health(user)
            if account.profile is not None:
                Profile.objects.create(user=user, **account.profile)
            for days_ago in account.cycle_starts_days_ago:
                self._cycle(user, today - datetime.timedelta(days=days_ago))
            if account.pregnant:
                lmp = today - datetime.timedelta(days=PREGNANCY_LMP_DAYS_AGO)
                Pregnancy.objects.create(
                    user=user, lmp_date=lmp, due_date=lmp + datetime.timedelta(days=GESTATION_DAYS)
                )
            if account.profile is not None:
                refresh_shared_status(user)
        return user

    def _reset_health(self, user: User) -> None:
        DailyLog.objects.for_user(user).delete()
        Cycle.objects.for_user(user).delete()
        Pregnancy.objects.for_user(user).delete()
        Profile.objects.for_user(user).delete()

    def _cycle(self, user: User, start: datetime.date) -> None:
        cycle = Cycle(
            user=user,
            start_date=start,
            end_date=start + datetime.timedelta(days=PERIOD_LENGTH_DAYS - 1),
        )
        calculate_cycle_projections(cycle, user)
        cycle.save()

    def _clear_partner_sharing(self, users: list[User]) -> None:
        # Every test run starts unlinked. Only these accounts are touched.
        with rls_bypass():
            PartnerLink.objects.filter(Q(owner__in=users) | Q(partner__in=users)).delete()
            PartnerInvite.objects.filter(user__in=users).delete()
