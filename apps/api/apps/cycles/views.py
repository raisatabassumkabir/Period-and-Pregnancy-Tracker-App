from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.cycles.models import Cycle, DailyLog
from apps.cycles.serializers import (
    CycleInitSerializer,
    CycleSerializer,
    DailyLogSerializer,
)
from apps.cycles.services import calculate_cycle_projections


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

    def perform_create(self, serializer):
        cycle = serializer.save(user=self.request.user)
        calculate_cycle_projections(cycle, self.request.user)
        cycle.save(update_fields=["estimated_ovulation_date", "next_period_date"])

    @action(detail=False, methods=["post"], url_path="init")
    def init_cycle(self, request):
        serializer = CycleInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        start_date = serializer.validated_data["start_date"]

        cycle = Cycle.objects.for_user(request.user).filter(start_date=start_date).first()
        if not cycle:
            cycle = Cycle(user=request.user, start_date=start_date)

        calculate_cycle_projections(cycle, request.user)
        cycle.save()

        # Anchor with initial DailyLog if not already logged
        if not DailyLog.objects.for_user(request.user).filter(date=start_date).exists():
            DailyLog.objects.create(
                user=request.user,
                date=start_date,
                flow=DailyLog.Flow.MEDIUM,
                notes="Cycle initialized",
            )

        return Response(CycleSerializer(cycle).data, status=status.HTTP_201_CREATED)


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
