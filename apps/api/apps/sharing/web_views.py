"""
Public, unauthenticated pages behind partner invite links. Not part of the
JSON API, and never read or confirm anything about an invite: the page only
echoes a code that already matches the code format.

- /.well-known/assetlinks.json  lets Android verify the App Link so
  https://<host>/p/<code> opens the app directly.
- /p/<code>                    fallback for phones without the app.
"""

import re

from django.conf import settings
from django.http import Http404, JsonResponse
from django.views.generic import TemplateView

CODE_PATTERN = re.compile(r"^HW-?[A-Z2-9]{4}-?[A-Z2-9]{4}$", re.IGNORECASE)


def asset_links(_request):
    """Digital Asset Links statement; empty until fingerprints are configured."""
    fingerprints = settings.ANDROID_APP_SHA256_FINGERPRINTS
    if not fingerprints:
        return JsonResponse([], safe=False)
    statement = {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": settings.ANDROID_APP_PACKAGE,
            "sha256_cert_fingerprints": fingerprints,
        },
    }
    return JsonResponse([statement], safe=False)


class InviteLandingView(TemplateView):
    template_name = "sharing/invite_landing.html"

    def get_context_data(self, **kwargs):
        code = kwargs["code"]
        if not CODE_PATTERN.match(code):
            raise Http404
        context = super().get_context_data(**kwargs)
        context.update(
            code=code.upper(),
            operator_name=settings.LEGAL_OPERATOR_NAME,
            play_store_url=settings.PLAY_STORE_URL,
        )
        return context
