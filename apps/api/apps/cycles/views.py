from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from apps.cycles.models import Cycle, DailyLog
from apps.cycles.serializers import CycleSerializer, DailyLogSerializer


class OwnedModelViewSet(viewsets.ModelViewSet):
    """
    Base viewset for user-owned resources.

    - get_queryset scopes EVERYTHING through for_user() (RULE 1), so
      get_object() 404s on another user's pk — existence is never leaked
      as a 403 (RULE 3).
    - perform_create stamps the owner server-side; the client cannot choose it.

    Subclasses set `model` and `serializer_class` only.
    """

    model = None

    def get_queryset(self):
        return self.model.objects.for_user(self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CycleViewSet(OwnedModelViewSet):
    model = Cycle
    serializer_class = CycleSerializer
    queryset = Cycle.objects.none()  # schema generation only; see get_queryset


class DailyLogViewSet(OwnedModelViewSet):
    model = DailyLog
    serializer_class = DailyLogSerializer
    queryset = DailyLog.objects.none()

    def perform_create(self, serializer):
        # Surface the (user, date) unique constraint as a 400, not a 500.
        if DailyLog.objects.for_user(self.request.user).filter(
            date=serializer.validated_data["date"]
        ).exists():
            raise ValidationError({"date": "A log for this date already exists."})
        super().perform_create(serializer)
