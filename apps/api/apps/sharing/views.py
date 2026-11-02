"""
Partner sharing endpoints.

- /api/partner-invites/   her: create (returns the code once), read, rename, delete
- /api/partner-links/     either side: redeem a code (POST), list, unlink (DELETE);
                          her only: change share switches (PATCH)
- /api/shared-statuses/   the partner: her narrow status (0 or 1 rows)
"""

from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.sharing import services
from apps.sharing.models import PartnerInvite, PartnerLink, SharedStatus
from apps.sharing.serializers import (
    PartnerInviteSerializer,
    PartnerLinkSerializer,
    RedeemSerializer,
    SharedStatusSerializer,
)

NO_STORE = {"Cache-Control": "private, no-store"}


class PartnerInviteViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PartnerInviteSerializer
    queryset = PartnerInvite.objects.none()  # schema generation only

    def get_queryset(self):
        return PartnerInvite.objects.for_user(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invite, code = services.create_invite(
            request.user, serializer.validated_data.get("display_name", "")
        )
        body = {
            **PartnerInviteSerializer(invite).data,
            "code": code,
            "url": services.invite_url(code),
        }
        return Response(body, status=status.HTTP_201_CREATED, headers=NO_STORE)


class PartnerLinkViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PartnerLinkSerializer
    queryset = PartnerLink.objects.none()  # schema generation only
    pagination_class = None  # at most one link per person

    def get_throttles(self):
        # Redeeming is the only guessable step; the scope caps code guessing.
        if self.action == "create":
            self.throttle_scope = "partner-redeem"
            return [*super().get_throttles(), ScopedRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        return PartnerLink.objects.for_user(self.request.user)

    def create(self, request, *args, **kwargs):
        redeem = RedeemSerializer(data=request.data)
        redeem.is_valid(raise_exception=True)
        link = services.redeem_invite(
            request.user, redeem.validated_data["code"], redeem.validated_data["display_name"]
        )
        body = self.get_serializer(link).data
        return Response(body, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        # Only she decides what she shares; the partner knows the link exists,
        # so this is a role check (403), not a hidden object (404).
        if serializer.instance.owner_id != self.request.user.pk:
            raise PermissionDenied("Only the person sharing can change these settings.")
        serializer.save()


class SharedStatusViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """The partner's read of her status. Empty list when not linked."""

    serializer_class = SharedStatusSerializer
    queryset = SharedStatus.objects.none()  # schema generation only
    pagination_class = None

    def get_queryset(self):
        return SharedStatus.objects.visible_to(self.request.user).exclude(user=self.request.user)

    def list(self, request, *args, **kwargs):
        link = PartnerLink.objects.for_user(request.user).filter(partner=request.user).first()
        if link is None:
            return Response([], headers=NO_STORE)
        statuses = self.get_queryset().filter(user_id=link.owner_id)
        context = {**self.get_serializer_context(), "link": link}
        data = SharedStatusSerializer(statuses, many=True, context=context).data
        return Response(data, headers=NO_STORE)
