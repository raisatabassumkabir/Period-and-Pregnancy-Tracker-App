import datetime

from django.db import models
from django.utils import timezone

from apps.core.models import OwnedModel


class Pregnancy(OwnedModel):
    """
    A pregnancy. At most one ACTIVE pregnancy per user (partial unique
    constraint). No SoftDeleteModel here or on any clinical table — "delete my
    data" must mean a real DELETE (ARCHITECTURE §4).
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ENDED = "ended", "Ended"

    lmp_date = models.DateField(
        null=True, blank=True, help_text="First day of last menstrual period."
    )
    due_date = models.DateField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "pregnancies"
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(status="active"),
                name="uniq_active_pregnancy_per_user",
            ),
        ]

    @property
    def current_week(self):
        """Gestational week (1-based) from LMP, or from due_date - 280 days."""
        anchor = self.lmp_date or (self.due_date - datetime.timedelta(days=280))
        days = (timezone.localdate() - anchor).days
        if days < 0:
            return None
        return days // 7 + 1

    def __str__(self):
        return f"Pregnancy<due {self.due_date}>"
