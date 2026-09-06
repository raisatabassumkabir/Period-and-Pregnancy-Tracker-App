from rest_framework.exceptions import ValidationError

from apps.cycles.views import OwnedModelViewSet
from apps.pregnancy.models import Pregnancy
from apps.pregnancy.serializers import PregnancySerializer


class PregnancyViewSet(OwnedModelViewSet):
    model = Pregnancy
    serializer_class = PregnancySerializer
    queryset = Pregnancy.objects.none()  # schema generation only; see get_queryset

    def perform_create(self, serializer):
        # Surface the partial unique constraint as a 400, not a 500.
        status = serializer.validated_data.get("status", Pregnancy.Status.ACTIVE)
        if status == Pregnancy.Status.ACTIVE and (
            Pregnancy.objects.for_user(self.request.user)
            .filter(status=Pregnancy.Status.ACTIVE)
            .exists()
        ):
            raise ValidationError({"status": "An active pregnancy already exists."})
        super().perform_create(serializer)
