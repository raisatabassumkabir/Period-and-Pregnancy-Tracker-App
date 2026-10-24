from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.core.rls import rls_user
from apps.users.models import Profile
from apps.users.serializers import ProfileSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth-register"


# simplejwt's views can't take throttle_scope through as_view(): Django only
# accepts kwargs that already exist as class attributes, and APIView has none.
class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth-token"


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth-token"


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
        # getattr's default already covers a missing profile/subscription
        # (RelatedObjectDoesNotExist is an AttributeError). Anything else is a
        # real failure: let it 500 and reach Sentry instead of reporting a
        # paying user as free.
        with rls_user(str(user.pk)):
            profile = getattr(user, "profile", None)
            if profile:
                full_name = getattr(profile, "full_name", None)
            subscription = getattr(user, "subscription", None)
            if subscription:
                is_premium = subscription.has_active_access()

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

