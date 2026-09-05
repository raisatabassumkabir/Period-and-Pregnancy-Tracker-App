from rest_framework import generics, mixins, permissions, viewsets

from apps.users.models import Profile
from apps.users.serializers import ProfileSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []


class ProfileViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    A user has exactly one profile (created at registration), so no create or
    destroy here — list returns at most one row, scoped by for_user().
    """

    serializer_class = ProfileSerializer
    queryset = Profile.objects.none()  # real queryset comes from get_queryset

    def get_queryset(self):
        return Profile.objects.for_user(self.request.user)
