"""
Browser half of password reset. The email link opens these pages on the API
domain, so the app needs no deep-link or App Links setup for resets.
"""

from django.contrib.auth.views import PasswordResetCompleteView, PasswordResetConfirmView
from django.urls import reverse_lazy
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from apps.users.models import User


def revoke_refresh_tokens(user: User) -> None:
    """Sign every device out: a reset usually means the old password leaked."""
    outstanding = OutstandingToken.objects.filter(user=user)
    BlacklistedToken.objects.bulk_create(
        [BlacklistedToken(token=token) for token in outstanding],
        ignore_conflicts=True,
    )


class RevokingPasswordResetConfirmView(PasswordResetConfirmView):
    # Not the default registration/ path: django.contrib.admin ships its own
    # templates there and comes first in INSTALLED_APPS.
    template_name = "users/password_reset_confirm.html"
    success_url = reverse_lazy("password-reset-complete")

    def form_valid(self, form):
        response = super().form_valid(form)
        revoke_refresh_tokens(form.user)
        return response


class PasswordResetDoneView(PasswordResetCompleteView):
    template_name = "users/password_reset_complete.html"
