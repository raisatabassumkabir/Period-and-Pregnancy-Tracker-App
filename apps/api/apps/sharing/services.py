"""
Partner-sharing business logic: invite codes, redeeming them, and keeping her
SharedStatus current. Views stay thin and call into here.
"""

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, connection, transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.core.exceptions import Conflict
from apps.cycles.models import Cycle
from apps.cycles.services import DEFAULT_CYCLE_LENGTH, DEFAULT_PERIOD_DURATION, LUTEAL_PHASE_DAYS
from apps.pregnancy.models import Pregnancy
from apps.sharing.models import PartnerInvite, PartnerLink, SharedStatus
from apps.users.models import Profile

INVITE_TTL = timedelta(days=7)
CODE_PREFIX = "HW"
# No 0/O, 1/I/L: codes are read aloud and typed on phones.
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
CODE_GROUP_LENGTH = 4
CODE_GROUPS = 2
INVALID_CODE = "This partner code is invalid or has expired."


def _generate_code() -> str:
    groups = [
        "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_GROUP_LENGTH))
        for _ in range(CODE_GROUPS)
    ]
    return "-".join([CODE_PREFIX, *groups])


def normalise_code(raw: str) -> str:
    """'hw-7k3m q9xa' -> 'HW-7K3M-Q9XA'. Tolerates spaces, dashes and lower case."""
    chars = "".join(ch for ch in raw.upper() if ch.isalnum())
    if chars.startswith(CODE_PREFIX):
        chars = chars[len(CODE_PREFIX) :]
    groups = [chars[i : i + CODE_GROUP_LENGTH] for i in range(0, len(chars), CODE_GROUP_LENGTH)]
    return "-".join([CODE_PREFIX, *groups])


def hash_code(code: str) -> str:
    return hashlib.sha256(normalise_code(code).encode()).hexdigest()


def invite_url(code: str, request=None) -> str:
    """
    The link she shares. In development PUBLIC_BASE_URL is localhost, which a
    phone can't reach, so the link uses the host the app called instead
    (e.g. 10.0.2.2:8000 from the emulator).
    """
    if settings.DEBUG and request is not None:
        return request.build_absolute_uri(f"/p/{code}")
    return f"{settings.PUBLIC_BASE_URL.rstrip('/')}/p/{code}"


def active_invites(user):
    """Her open invite (at most one): unredeemed and not yet expired."""
    return PartnerInvite.objects.for_user(user).filter(
        redeemed_at__isnull=True, expires_at__gt=timezone.now()
    )


@transaction.atomic
def create_invite(user, display_name: str = "") -> tuple[PartnerInvite, str]:
    """Replaces her open invites with a fresh one. One partner at a time."""
    if PartnerLink.objects.for_user(user).exists():
        raise Conflict({"code": ["You are already linked to a partner. Unlink first."]})
    PartnerInvite.objects.for_user(user).filter(redeemed_at__isnull=True).delete()
    refresh_shared_status(user)
    code = _generate_code()
    invite = PartnerInvite.objects.create(
        user=user,
        code_hash=hash_code(code),
        code=code,
        display_name=display_name,
        expires_at=timezone.now() + INVITE_TTL,
    )
    return invite, code


def _expose_invite(code_hash: str) -> None:
    # Opens exactly one invite row to this transaction under the `redeem` RLS
    # policy. Transaction-local, like app.user_id (see apps.core.rls).
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.invite_code_hash', %s, true)", [code_hash])


@transaction.atomic
def redeem_invite(partner, code: str, display_name: str = "") -> PartnerLink:
    code_hash = hash_code(code)
    _expose_invite(code_hash)
    invite = PartnerInvite.objects.filter(
        code_hash=code_hash, redeemed_at__isnull=True, expires_at__gt=timezone.now()
    ).first()
    if invite is None:
        raise NotFound(INVALID_CODE)  # expired and unknown look identical (rule 3)
    if invite.user_id == partner.pk:
        raise ValidationError({"code": ["You can't link to your own invite."]})
    try:
        with transaction.atomic():
            link = PartnerLink.objects.create(
                owner_id=invite.user_id,
                partner=partner,
                owner_name=invite.display_name,
                partner_name=display_name,
            )
    except IntegrityError as exc:
        raise Conflict({"code": ["One of you is already linked to a partner."]}) from exc
    # A used code is worthless; don't keep it around.
    invite.redeemed_at = timezone.now()
    invite.code = ""
    invite.save(update_fields=["redeemed_at", "code", "updated_at"])
    return link


def refresh_shared_status(user) -> SharedStatus:
    """Recomputes her shareable anchors. Runs in her own RLS context."""
    profile = Profile.objects.for_user(user).first()
    cycle_length = getattr(profile, "average_cycle_length", None) or DEFAULT_CYCLE_LENGTH
    period_length = getattr(profile, "average_period_duration", None) or DEFAULT_PERIOD_DURATION
    latest = Cycle.objects.for_user(user).order_by("-start_date").first()
    pregnancy = Pregnancy.objects.for_user(user).filter(status=Pregnancy.Status.ACTIVE).first()
    next_period = None
    ovulation = None
    if latest is not None:
        next_period = latest.next_period_date or latest.start_date + timedelta(days=cycle_length)
        ovulation = latest.estimated_ovulation_date or next_period - timedelta(
            days=LUTEAL_PHASE_DAYS
        )
    status, _created = SharedStatus.objects.update_or_create(
        user=user,
        defaults={
            "mode": getattr(profile, "mode", Profile.Mode.CYCLE_TRACKING),
            "cycle_length": cycle_length,
            "period_length": period_length,
            "last_period_start": latest.start_date if latest else None,
            "next_period_date": next_period,
            "ovulation_date": ovulation,
            "pregnancy_due_date": pregnancy.due_date if pregnancy else None,
        },
    )
    return status
