from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.core.constants import CONDITION_TAXONOMY
from apps.users.models import Profile, User


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        # Explicit allowlist — never fields = "__all__" on health data (RULE 4).
        fields = [
            "id",
            "mode",
            "date_of_birth",
            "country",
            "language",
            "timezone",
            "diet",
            "budget_tier",
            "medical_conditions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_medical_conditions(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list of condition codes.")
        unknown = {str(v) for v in value} - CONDITION_TAXONOMY
        if unknown:
            # Never echo submitted values back (rule 5): count only.
            raise serializers.ValidationError(
                f"{len(unknown)} unknown condition code(s); see the documented taxonomy."
            )
        return sorted(set(value))

    def validate_country(self, value):
        if value and (len(value) != 2 or not value.isalpha()):
            raise serializers.ValidationError("Use an ISO 3166-1 alpha-2 code, e.g. 'BD'.")
        return value.upper()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    profile = ProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ["id", "email", "password", "profile"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        from apps.core.rls import rls_user

        profile_data = validated_data.pop("profile", {})
        user = User.objects.create_user(
            email=validated_data["email"], password=validated_data["password"]
        )
        # users_user has no RLS, but users_profile does. At registration time the
        # request is anonymous (app.user_id is empty), so we scope the INSERT to
        # the user we just created — the WITH CHECK clause then passes.
        with rls_user(str(user.pk)):
            Profile.objects.create(user=user, **profile_data)
        return user
