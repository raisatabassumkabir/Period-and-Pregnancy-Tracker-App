from django.db import IntegrityError, transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.core.exceptions import Conflict
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
        self._save_or_conflict(serializer, user=self.request.user)

    def perform_update(self, serializer):
        self._save_or_conflict(serializer)

    def _save_or_conflict(self, serializer, **kwargs):
        try:
            with transaction.atomic():
                serializer.save(**kwargs)
        except IntegrityError as exc:
            raise Conflict(self.conflict_detail) from exc


class CycleViewSet(OwnedModelViewSet):
    model = Cycle
    serializer_class = CycleSerializer
    queryset = Cycle.objects.none()  # schema generation only; see get_queryset
    conflict_detail = "A cycle starting on this date already exists."

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        start = serializer.validated_data["start_date"]
        if Cycle.objects.for_user(self.request.user).filter(start_date=start).exists():
            raise Conflict({"start_date": ["A cycle starting on this date already exists."]})
        with transaction.atomic():
            super().perform_create(serializer)
            # Compute and persist projections on the created cycle
            cycle = Cycle.objects.for_user(self.request.user).filter(start_date=start).first()
            if cycle:
                calculate_cycle_projections(cycle, self.request.user)
                cycle.save(update_fields=["estimated_ovulation_date", "next_period_date"])

    @action(detail=False, methods=["post"], url_path="init")
    @transaction.atomic
    def init_cycle(self, request):
        serializer = CycleInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        start_date = serializer.validated_data["start_date"]

        with transaction.atomic():
            cycle = Cycle.objects.for_user(request.user).filter(start_date=start_date).first()
            if not cycle:
                cycle = Cycle.objects.create(user=request.user, start_date=start_date)

            calculate_cycle_projections(cycle, request.user)
            cycle.save()

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
    conflict_detail = "A log for this date already exists."

    def perform_create(self, serializer):
        # One log per user per calendar day: a duplicate is a 409 conflict
        # (the day exists; PATCH it), not a validation failure.
        date = serializer.validated_data["date"]
        if DailyLog.objects.for_user(self.request.user).filter(date=date).exists():
            raise Conflict({"date": ["A log for this date already exists."]})
        super().perform_create(serializer)
