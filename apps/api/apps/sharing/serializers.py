from rest_framework import serializers

from apps.sharing import services
from apps.sharing.models import PartnerInvite, PartnerLink, SharedStatus
from apps.users.models import Profile

NAME_MAX_LENGTH = 40
CODE_MAX_LENGTH = 20
PREGNANCY_MODES = {Profile.Mode.PREGNANCY, Profile.Mode.POSTPARTUM}
PRIVATE_MODE = "private"


class PartnerInviteSerializer(serializers.ModelSerializer):
    """Her invite, with the code and the link to share. Only she can read it."""

    url = serializers.SerializerMethodField()

    class Meta:
        model = PartnerInvite
        fields = ["id", "code", "url", "display_name", "expires_at", "redeemed_at"]
        read_only_fields = ["id", "code", "url", "expires_at", "redeemed_at"]

    def get_url(self, invite: PartnerInvite) -> str:
        return services.invite_url(invite.code, self.context.get("request"))


class RedeemSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=CODE_MAX_LENGTH)
    display_name = serializers.CharField(
        max_length=NAME_MAX_LENGTH, required=False, allow_blank=True, default=""
    )


class PartnerLinkSerializer(serializers.ModelSerializer):
    """Seen from the requester's side: their role and the other person's name."""

    role = serializers.SerializerMethodField()
    other_name = serializers.SerializerMethodField()

    class Meta:
        model = PartnerLink
        fields = [
            "id",
            "role",
            "other_name",
            "share_fertile_window",
            "share_pregnancy",
            "created_at",
        ]
        read_only_fields = ["id", "role", "other_name", "created_at"]

    def _is_owner(self, link: PartnerLink) -> bool:
        return link.owner_id == self.context["request"].user.pk

    def get_role(self, link: PartnerLink) -> str:
        return "owner" if self._is_owner(link) else "partner"

    def get_other_name(self, link: PartnerLink) -> str:
        return link.partner_name if self._is_owner(link) else link.owner_name


class SharedStatusSerializer(serializers.ModelSerializer):
    """
    What a partner sees. The link's share switches are applied HERE, on every
    read, so turning one off takes effect immediately.
    """

    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = SharedStatus
        fields = [
            "owner_name",
            "mode",
            "cycle_length",
            "period_length",
            "last_period_start",
            "next_period_date",
            "ovulation_date",
            "pregnancy_due_date",
            "updated_at",
        ]

    def get_owner_name(self, status: SharedStatus) -> str:
        return self.context["link"].owner_name

    def to_representation(self, status: SharedStatus):
        data = super().to_representation(status)
        link: PartnerLink = self.context["link"]
        if not link.share_fertile_window:
            data["ovulation_date"] = None
        if not link.share_pregnancy:
            data["pregnancy_due_date"] = None
            if status.mode in PREGNANCY_MODES:
                data["mode"] = PRIVATE_MODE
        return data
