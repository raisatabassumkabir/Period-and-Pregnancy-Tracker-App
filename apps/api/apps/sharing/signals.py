"""
Keeps SharedStatus in step with her data. Every change to a cycle, pregnancy
or profile happens in her own request (her RLS context), so the refresh can
write her row. Deleting a user cascades away her status and links.
"""

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.cycles.models import Cycle
from apps.pregnancy.models import Pregnancy
from apps.sharing.services import refresh_shared_status
from apps.users.models import Profile, User

SOURCES = (Cycle, Pregnancy, Profile)


for source in SOURCES:

    @receiver(
        post_save, sender=source, weak=False, dispatch_uid=f"shared-status-save-{source.__name__}"
    )
    def _on_save(sender, instance, **kwargs):
        refresh_shared_status(instance.user)

    @receiver(
        post_delete, sender=source, weak=False, dispatch_uid=f"shared-status-del-{source.__name__}"
    )
    def _on_delete(sender, instance, origin=None, **kwargs):
        # Account deletion cascades through her cycles first. Recreating her
        # status mid-cascade would point at a user about to vanish and fail
        # the whole deletion at commit.
        if isinstance(origin, User):
            return
        refresh_shared_status(instance.user)
