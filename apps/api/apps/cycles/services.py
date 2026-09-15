from datetime import timedelta
from apps.users.models import Profile

DEFAULT_CYCLE_LENGTH = 28
DEFAULT_PERIOD_DURATION = 5
LUTEAL_PHASE_DAYS = 14
FERTILE_WINDOW_START_OFFSET = 5
FERTILE_WINDOW_END_OFFSET = 1


def calculate_cycle_projections(cycle, user=None):
    """
    Synchronously calculates and sets estimated_ovulation_date and next_period_date for a cycle
    based on the user's Profile average_cycle_length (or default 28 days) before returning response.
    """
    owner = user or getattr(cycle, "user", None)
    profile = Profile.objects.filter(user=owner).first() if owner else None

    cycle_length = (
        profile.average_cycle_length
        if profile and profile.average_cycle_length
        else DEFAULT_CYCLE_LENGTH
    )

    # Ovulation typically occurs (cycle_length - 14) days after cycle start date
    ovulation_offset = max(1, cycle_length - LUTEAL_PHASE_DAYS)
    cycle.estimated_ovulation_date = cycle.start_date + timedelta(days=ovulation_offset)
    cycle.next_period_date = cycle.start_date + timedelta(days=cycle_length)
    return cycle

