from rest_framework import serializers

from apps.pregnancy.models import Pregnancy


class PregnancySerializer(serializers.ModelSerializer):
    current_week = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = Pregnancy
        # Explicit allowlist (RULE 4); `user` set server-side only.
        fields = [
            "id",
            "lmp_date",
            "due_date",
            "status",
            "notes",
            "current_week",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "current_week", "created_at", "updated_at"]
