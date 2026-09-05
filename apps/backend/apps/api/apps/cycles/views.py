from django.db import IntegrityError, transaction
from rest_framework import viewsets

from apps.core.exceptions import Conflict
from apps.cycles.models import Cycle, DailyLog
from apps.cycles.serializers import CycleSerializer, DailyLogSerializer


class OwnedModelViewSet(viewsets.ModelViewSet):
    """
    Base viewset for user-owned resources.

    - get_queryset scopes EVERYTHING through for_user() (RULE 1), so
      get_object() 404s on another user's pk — existence is never leaked
      as a 403 (RULE 3).
    - perform_create stamps the owner server-side; the client cannot choose it.
    - A unique-constraint violation the pre-checks missed (two concurrent
      retries of the same POST) becomes a 409 Problem, never a 500. The
      savepoint keeps the request's outer RLS transaction usable.

    Subclasses set `model` and `serializer_class` only.
    """

    model = None
    conflict_detail = "A resource with these values already exists."

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

    def perform_create(self, serializer):
        start = serializer.validated_data["start_date"]
        if Cycle.objects.for_user(self.request.user).filter(start_date=start).exists():
            raise Conflict({"start_date": ["A cycle starting on this date already exists."]})
        super().perform_create(serializer)


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
