"""
Public legal pages the Play Store listing and the app's Settings link to.
HTML, not part of the JSON API, and served without authentication.
"""

from django.conf import settings
from django.views.generic import TemplateView


class LegalPageView(TemplateView):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            operator_name=settings.LEGAL_OPERATOR_NAME,
            support_email=settings.SUPPORT_EMAIL,
            effective_date=settings.LEGAL_EFFECTIVE_DATE,
            backup_retention_days=settings.BACKUP_RETENTION_DAYS,
        )
        return context
