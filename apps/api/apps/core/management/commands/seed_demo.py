import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.core.rls import rls_user
from apps.cycles.models import Cycle, DailyLog
from apps.pregnancy.models import Pregnancy
from apps.users.models import Profile, User

DEMO_PASSWORD = "HappyWomen2026!"


class Command(BaseCommand):
    help = "Wipes existing users and creates fresh demo accounts."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Wiping old data..."))
        
        with transaction.atomic():
            # 1. Wipe all existing users (except superusers)
            User.objects.filter(is_superuser=False).delete()
            
            # 2. test1@happywomen.com: Cycle Tracking Flow
            user1 = User.objects.create_user(email="test1@happywomen.com", password=DEMO_PASSWORD)
            with rls_user(str(user1.pk)):
                Profile.objects.create(
                    user=user1,
                    mode=Profile.Mode.CYCLE_TRACKING,
                    average_cycle_length=28,
                    average_period_duration=5,
                )
                start_date = timezone.localdate() - datetime.timedelta(days=10)
                Cycle.objects.create(
                    user=user1,
                    start_date=start_date,
                    estimated_ovulation_date=start_date + datetime.timedelta(days=14),
                    next_period_date=start_date + datetime.timedelta(days=28)
                )

            self.stdout.write(self.style.SUCCESS("  [CREATED] test1 (Cycle Tracking)"))

            # 3. test2@happywomen.com: Pregnancy Flow
            user2 = User.objects.create_user(email="test2@happywomen.com", password=DEMO_PASSWORD)
            with rls_user(str(user2.pk)):
                Profile.objects.create(
                    user=user2,
                    mode=Profile.Mode.PREGNANCY,
                )
                lmp_date = timezone.localdate() - datetime.timedelta(days=60)
                due_date = lmp_date + datetime.timedelta(days=280)
                Pregnancy.objects.create(
                    user=user2,
                    lmp_date=lmp_date,
                    due_date=due_date,
                    status=Pregnancy.Status.ACTIVE
                )
                
            self.stdout.write(self.style.SUCCESS("  [CREATED] test2 (Pregnancy Flow)"))

            # 4. test3@happywomen.com: Fresh Account (Empty profile, needs onboarding)
            User.objects.create_user(email="test3@happywomen.com", password=DEMO_PASSWORD)
            
            self.stdout.write(self.style.SUCCESS("  [CREATED] test3 (Fresh Account)"))

        self.stdout.write(self.style.SUCCESS("\nDone! 3 Demo accounts created successfully."))
