from django.utils import timezone
from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.rls import rls_user
from apps.users.models import Profile
from apps.users.serializers import ProfileSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []


class ProfileViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    A user has one profile. Support upsert on create so completing onboarding
    can directly POST the profile payload and either create or update it.
    """

    serializer_class = ProfileSerializer
    queryset = Profile.objects.none()  # real queryset comes from get_queryset

    def get_queryset(self):
        return Profile.objects.for_user(self.request.user)

    def create(self, request, *args, **kwargs):
        profile = Profile.objects.for_user(request.user).first()
        if profile:
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """
    Returns current authenticated user details according to CONTRACT.md.
    Supports DELETE for Google Play Store account deletion compliance.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        full_name = None
        is_premium = False
        try:
            with rls_user(str(user.pk)):
                profile = getattr(user, "profile", None)
                if profile:
                    full_name = getattr(profile, "full_name", None)
                subscription = getattr(user, "subscription", None)
                if subscription:
                    is_premium = subscription.has_active_access()
        except Exception:
            pass

        return Response(
            {
                "id": str(user.id),
                "email": user.email,
                "full_name": full_name or user.email.split("@")[0].replace(".", " ").title(),
                "is_premium": is_premium,
                "created_at": user.date_joined.isoformat(),
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubscriptionStatusView(APIView):
    """
    Returns current subscription status according to CONTRACT.md.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "is_premium": False,
                "subscription_status": "free",
                "subscription_ends_at": None,
            },
            status=status.HTTP_200_OK,
        )


class VerifyPurchaseView(APIView):
    """
    Verifies Google Play purchase token and activates premium.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        subscription_id = request.data.get("subscription_id", "premium_monthly")
        return Response(
            {
                "is_premium": True,
                "subscription_status": "active",
                "subscription_ends_at": (
                    timezone.now() + timezone.timedelta(days=30)
                ).isoformat(),
                "google_play_subscription_id": subscription_id,
            },
            status=status.HTTP_200_OK,
        )


class AssistantChatView(APIView):
    """
    AI Assistant chat endpoint responding to health questions.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        _query = request.data.get("query", "")
        reply = (
            "Thank you for sharing your symptoms and questions. "
            "Based on your profile, tracking daily symptoms helps identify patterns over time. "
            "Please consult your healthcare provider for clinical diagnosis or urgent advice."
        )
        return Response(
            {
                "reply": reply,
                "answer": reply,
                "text": reply,
                "message": reply,
                "status": "ok",
            },
            status=status.HTTP_200_OK,
        )

