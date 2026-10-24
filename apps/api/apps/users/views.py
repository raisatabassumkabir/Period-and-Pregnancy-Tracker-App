import hashlib
import uuid

from django.core.cache import cache
from django.db import transaction
from rest_framework import generics, mixins, permissions, serializers, status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.core.exceptions import IdempotencyKeyConflict
from apps.core.rls import rls_user
from apps.users.models import Profile, User
from apps.users.serializers import (
    PasswordResetRequestSerializer,
    ProfileSerializer,
    RegisterSerializer,
)
from apps.users.tasks import send_password_reset_email

# Same body whether or not the email has an account, so the endpoint can't be
# used to find out who uses the app.
PASSWORD_RESET_ACCEPTED_DETAIL = (
    "If an account exists for that email, we've sent a link to reset the password."
)
IDEMPOTENCY_KEY_TTL_SECONDS = 24 * 60 * 60
MAX_IDEMPOTENCY_KEY_LENGTH = 255


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


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _is_replayed_reset_request(idempotency_key: str, email: str) -> bool:
    """
    API-edge half of the idempotency contract (the worker has the other half).
    First use of a key records which email it was for; a replay with the same
    email is a no-op, a replay with a different email is a client bug (409).
    """
    if len(idempotency_key) > MAX_IDEMPOTENCY_KEY_LENGTH:
        raise serializers.ValidationError(
            {"Idempotency-Key": [f"Must be at most {MAX_IDEMPOTENCY_KEY_LENGTH} characters."]}
        )
    cache_key = f"pwreset:idem:{_sha256(idempotency_key)}"
    fingerprint = _sha256(email.lower())
    if cache.add(cache_key, fingerprint, IDEMPOTENCY_KEY_TTL_SECONDS):
        return False
    if cache.get(cache_key) != fingerprint:
        raise IdempotencyKeyConflict()
    return True


def _enqueue_reset_email(email: str, idempotency_key: str) -> None:
    # Pre-auth lookup by email: there is no request.user to scope to, users_user
    # carries no health data, and the response is identical either way.
    user = User.objects.filter(email__iexact=email, is_active=True).first()  # rls: allow
    if user is None or not user.has_usable_password():
        return
    user_id = str(user.pk)
    # After commit, like every task enqueued from inside RLSMiddleware's transaction.
    transaction.on_commit(
        lambda: send_password_reset_email.delay(user_id=user_id, idempotency_key=idempotency_key)
    )


class PasswordResetRequestView(APIView):
    """
    POST auth/password-resets/ -> 202. The email carries a link to a page on
    this domain (apps/users/web_views.py) where the new password is set.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password-reset"
    serializer_class = PasswordResetRequestSerializer  # for the OpenAPI schema

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        client_key = request.headers.get("Idempotency-Key")
        if client_key and _is_replayed_reset_request(client_key, email):
            return self._accepted()

        _enqueue_reset_email(email, client_key or uuid.uuid4().hex)
        return self._accepted()

    @staticmethod
    def _accepted() -> Response:
        return Response({"detail": PASSWORD_RESET_ACCEPTED_DETAIL}, status=status.HTTP_202_ACCEPTED)
