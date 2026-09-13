"""
Django Management Command: create_test_accounts
Creates exactly 3 clean-slate test accounts with NO preset health data or onboarding state.

Usage:
    python manage.py create_test_accounts
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.core.rls import rls_user
from apps.cycles.models import Cycle, DailyLog
from apps.pregnancy.models import Pregnancy
from apps.users.models import Profile, User

TEST_ACCOUNTS = [
    {"email": "test1@happywomen.com", "password": "TestUser2026!"},
    {"email": "test2@happywomen.com", "password": "TestUser2026!"},
    {"email": "test3@happywomen.com", "password": "TestUser2026!"},
]


class Command(BaseCommand):
    help = "Creates 3 clean-slate test accounts for verifying the unboarded user flow."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Initializing clean-slate test accounts..."))

        for acc in TEST_ACCOUNTS:
            email = acc["email"]
            password = acc["password"]

            with transaction.atomic():
                user = User.objects.filter(email=email).first()
                if user is None:
                    user = User.objects.create_user(email=email, password=password)
                    self.stdout.write(self.style.SUCCESS(f"  [CREATED] User auth record: {email}"))
                else:
                    user.set_password(password)
                    user.is_active = True
                    user.save()
                    self.stdout.write(self.style.WARNING(f"  [RESET] Password updated: {email}"))

                # CRITICAL CONSTRAINT: Strip all profile and health data so the user
                # has zero onboarding flags or clinical history.
                with rls_user(str(user.pk)):
                    Profile.objects.filter(user=user).delete()
                    Cycle.objects.filter(user=user).delete()
                    DailyLog.objects.filter(user=user).delete()
                    Pregnancy.objects.filter(user=user).delete()

        self.stdout.write(self.style.SUCCESS("\nDone! 3 Clean-slate test accounts are ready:"))
        for acc in TEST_ACCOUNTS:
            self.stdout.write(f"  • Email: {acc['email']} | Password: {acc['password']}")
        self.stdout.write(
            self.style.NOTICE(
                "\nAccounts contain 0 attached profiles, forcing immediate routing to Screen 1 of Onboarding.\n"
            )
        )
