"""
Single DRF router for the whole API.

Kept in its own module (rather than inline in urls.py) so
tests/test_cross_user_access.py can walk `router.registry` and refuse to pass
if a user-owned viewset is registered here without a cross-user 404 test.
"""

from rest_framework.routers import DefaultRouter

from apps.cycles.views import CycleViewSet, DailyLogViewSet
from apps.pregnancy.views import PregnancyViewSet
from apps.users.views import ProfileViewSet

router = DefaultRouter()
router.register("profiles", ProfileViewSet, basename="profile")
router.register("cycles", CycleViewSet, basename="cycle")
router.register("daily-logs", DailyLogViewSet, basename="dailylog")
router.register("pregnancies", PregnancyViewSet, basename="pregnancy")
