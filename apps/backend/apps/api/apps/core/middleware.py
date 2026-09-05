"""
RLS middleware — sets the transaction-local `app.user_id` variable that the
Postgres row-level-security policies compare against.

One deliberate deviation from the snippet in ARCHITECTURE §6, and it matters:
that snippet reads `request.user`, but DRF authenticates JWTs at the VIEW
layer, after all middleware has run. At middleware time a JWT request's
`request.user` is always AnonymousUser, so `app.user_id` would never be set
and every request would see zero rows. We therefore authenticate the bearer
token ourselves here. Session auth (Django admin, browsable API in dev) still
comes through `request.user` because AuthenticationMiddleware runs before us.
"""

from django.db import connection, transaction
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class RLSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

    def __call__(self, request):
        user_id = self._resolve_user_id(request)
        bypass = self._is_admin_request(request)

        # The whole request runs in one transaction so the variables set below
        # (is_local=true → transaction-scoped) cover every query the view makes,
        # and evaporate before the pooled connection serves anyone else.
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT set_config('app.user_id', %s, true),"
                    "       set_config('app.bypass', %s, true)",
                    [user_id or "", "on" if bypass else ""],
                )
            response = self.get_response(request)
            # DRF responses are lazily-rendered TemplateResponses; render inside
            # the transaction so no query ever runs after app.user_id is gone.
            # (If one did anyway, RLS fails CLOSED — empty result, not a leak.)
            if hasattr(response, "render") and callable(response.render):
                response.render()
        return response

    def _resolve_user_id(self, request):
        # 1. Session-authenticated user (admin / dev browsable API).
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated:
            return str(user.pk)
        # 2. JWT bearer token, authenticated here because DRF won't have yet.
        try:
            result = self.jwt_auth.authenticate(request)
        except (InvalidToken, TokenError):
            # Invalid/expired token: leave app.user_id empty (deny-by-default);
            # DRF will independently reject the request with a 401 at the view.
            return None
        if result is not None:
            token_user, _token = result
            return str(token_user.pk)
        return None

    def _is_admin_request(self, request):
        # The bypass policy exists for staff working in Django admin. It is
        # path-scoped AND staff-scoped; API requests can never reach it.
        user = getattr(request, "user", None)
        return (
            request.path.startswith("/admin/")
            and user is not None
            and user.is_authenticated
            and user.is_staff
        )
