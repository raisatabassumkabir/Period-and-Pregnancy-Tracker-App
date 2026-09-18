from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.users.views import MeView, RegisterView, SubscriptionStatusView
from config.api_router import router


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/auth/register/", RegisterView.as_view(), name="auth-register"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/me", MeView.as_view(), name="me"),
    path("api/payments/subscription-status/", SubscriptionStatusView.as_view(), name="subscription-status"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path("api/", include(router.urls)),
    # Versioned API routes matching mobile app client baseURL (/api/v1/)
    path("api/v1/auth/register/", RegisterView.as_view(), name="v1-auth-register"),
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="v1-token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="v1-token_refresh"),
    path("api/v1/me", MeView.as_view(), name="v1-me"),
    path("api/v1/payments/subscription-status/", SubscriptionStatusView.as_view(), name="v1-subscription-status"),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="v1-schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="v1-schema"), name="v1-docs"),
    path("api/v1/", include(router.urls)),
]
