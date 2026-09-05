from apps.core.exceptions import Conflict
from apps.cycles.views import OwnedModelViewSet
from apps.pregnancy.models import Pregnancy
from apps.pregnancy.serializers import PregnancySerializer


class PregnancyViewSet(OwnedModelViewSet):
    model = Pregnancy
    serializer_class = PregnancySerializer
    queryset = Pregnancy.objects.none()  # schema generation only; see get_queryset
    conflict_detail = "An active pregnancy already exists."

    def perform_create(self, serializer):
        # At most one ACTIVE pregnancy per user (partial unique constraint):
        # a second one is a 409 conflict, not a validation failure.
        status = serializer.validated_data.get("status", Pregnancy.Status.ACTIVE)
        if status == Pregnancy.Status.ACTIVE and (
            Pregnancy.objects.for_user(self.request.user)
            .filter(status=Pregnancy.Status.ACTIVE)
            .exists()
        ):
            raise Conflict({"status": ["An active pregnancy already exists."]})
        super().perform_create(serializer)
