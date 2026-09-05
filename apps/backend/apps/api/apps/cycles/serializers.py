from rest_framework import serializers

from apps.core.constants import SYMPTOM_TAXONOMY
from apps.cycles.models import Cycle, DailyLog


class CycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cycle
        # Explicit allowlist (RULE 4). `user` is intentionally absent: it is set
        # server-side from the authenticated request, never client-supplied.
        fields = ["id", "start_date", "end_date", "notes", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError("end_date cannot precede start_date.")
        return attrs


class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = [
            "id",
            "date",
            "flow",
            "mood",
            "symptoms",
            "temperature_celsius",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_symptoms(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list of symptom codes.")
        unknown = {str(v) for v in value} - SYMPTOM_TAXONOMY
        if unknown:
            # Never echo submitted values back (rule 5): count only.
            raise serializers.ValidationError(
                f"{len(unknown)} unknown symptom code(s); see the documented taxonomy."
            )
        return sorted(set(value))
