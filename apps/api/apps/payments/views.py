from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.models import Subscription


class SubscriptionStatusView(APIView):
    """
    Authoritative subscription status endpoint for Happy Women.

    Returns the user's current subscription projection, including entitlement status,
    active state, and store metadata according to CONTRACT.md.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        subscription = Subscription.objects.for_user(request.user).first()

        if subscription is None:
            return Response(
                {
                    "is_premium": False,
                    "subscription_status": Subscription.Status.FREE,
                    "subscription_ends_at": None,
                    "entitlement_id": None,
                    "product_id": None,
                    "store": None,
                    "is_sandbox": False,
                    "last_synced_at": None,
                },
                status=status.HTTP_200_OK,
            )

        # A cancelled subscription remains premium until its expiration date.
        has_access = subscription.has_active_access()

        # If a non-free subscription has expired, reflect expired status
        effective_status = subscription.status
        if not has_access and subscription.status in (
            Subscription.Status.ACTIVE,
            Subscription.Status.CANCELLED,
            Subscription.Status.TRIALING,
        ):
            effective_status = Subscription.Status.EXPIRED

        return Response(
            {
                "is_premium": has_access,
                "subscription_status": effective_status,
                "subscription_ends_at": (
                    subscription.expires_at.isoformat()
                    if subscription.expires_at
                    else None
                ),
                "entitlement_id": subscription.entitlement_id,
                "product_id": subscription.product_id or None,
                "store": subscription.store,
                "is_sandbox": subscription.is_sandbox,
                "last_synced_at": (
                    subscription.last_synced_at.isoformat()
                    if subscription.last_synced_at
                    else None
                ),
            },
            status=status.HTTP_200_OK,
        )
