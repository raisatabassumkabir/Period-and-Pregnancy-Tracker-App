from django.db import models

from apps.core.models import OwnedModel


class Cycle(OwnedModel):
    """One menstrual cycle. end_date stays NULL while the cycle is ongoing."""

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-start_date"]
        constraints = [
            models.UniqueConstraint(fields=["user", "start_date"], name="uniq_cycle_user_start"),
            models.CheckConstraint(
                condition=models.Q(end_date__isnull=True)
                | models.Q(end_date__gte=models.F("start_date")),
                name="cycle_end_after_start",
            ),
        ]

    def __str__(self):
        return f"Cycle<{self.start_date}>"


class DailyLog(OwnedModel):
    """
    One log per user per day (DB-enforced). `symptoms` is JSONB validated
    against apps.core.constants.SYMPTOM_TAXONOMY; anything we later need to
    query or chart gets promoted to a structured column instead.
    """

    class Flow(models.TextChoices):
        NONE = "none", "None"
        SPOTTING = "spotting", "Spotting"
        LIGHT = "light", "Light"
        MEDIUM = "medium", "Medium"
        HEAVY = "heavy", "Heavy"

    class Mood(models.TextChoices):
        UNSPECIFIED = "unspecified", "Unspecified"
        GREAT = "great", "Great"
        GOOD = "good", "Good"
        NEUTRAL = "neutral", "Neutral"
        LOW = "low", "Low"
        BAD = "bad", "Bad"

    date = models.DateField()
    flow = models.CharField(max_length=16, choices=Flow.choices, default=Flow.NONE)
    mood = models.CharField(max_length=16, choices=Mood.choices, default=Mood.UNSPECIFIED)
    symptoms = models.JSONField(default=list, blank=True)
    temperature_celsius = models.DecimalField(
        max_digits=4, decimal_places=2, null=True, blank=True
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="uniq_dailylog_user_date"),
        ]

    def __str__(self):
        return f"DailyLog<{self.date}>"
