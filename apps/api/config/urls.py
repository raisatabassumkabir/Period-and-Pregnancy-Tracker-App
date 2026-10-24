from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.payments.views import (
    DeprecatedVerifyPurchaseView,
    RevenueCatWebhookView,
    SubscriptionStatusView,
    SubscriptionSyncView,
)
from apps.users.views import (
    MeView,
    PasswordResetRequestView,
    RegisterView,
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
)
from apps.users.web_views import PasswordResetDoneView, RevokingPasswordResetConfirmView
from config.api_router import router


def health(_request):
    return JsonResponse({"status": "ok"})


api_patterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/token/", ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", ThrottledTokenRefreshView.as_view(), name="token_refresh"),
    path("auth/password-resets/", PasswordResetRequestView.as_view(), name="password-resets"),
    path("me", MeView.as_view(), name="user-me"),
    path("me/", MeView.as_view(), name="user-me-slash"),
    path(
        "payments/subscription-status/",
        SubscriptionStatusView.as_view(),
        name="subscription-status",
    ),
    path(
        "payments/subscription-sync/",
        SubscriptionSyncView.as_view(),
        name="subscription-sync",
    ),
    path(
        "payments/revenuecat/webhook/",
        RevenueCatWebhookView.as_view(),
        name="revenuecat-webhook",
    ),
    path(
        "payments/google-play/verify-purchase/",
        DeprecatedVerifyPurchaseView.as_view(),
        name="verify-purchase",
    ),
    path("", include(router.urls)),
]

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path("health/", health),
    # Browser pages the reset email links to (HTML, not part of the JSON API).
    path(
        "accounts/password-reset/done/",
        PasswordResetDoneView.as_view(),
        name="password-reset-complete",
    ),
    path(
        "accounts/password-reset/<uidb64>/<token>/",
        RevokingPasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path("api/", include(api_patterns)),
    path("api/v1/", include(api_patterns)),
]

if settings.API_DOCS_ENABLED:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    ]

