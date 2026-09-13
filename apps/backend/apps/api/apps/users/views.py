from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.response import Response

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
