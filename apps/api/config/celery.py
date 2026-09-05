import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("femtech")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# RLS note: Celery workers have no request, so `app.user_id` is never set and every
# query against an RLS-protected table returns zero rows by default (deny-by-default).
# Tasks that act on behalf of a user must wrap their DB work in
# `apps.core.rls.rls_user(user_id)`; maintenance tasks use `apps.core.rls.rls_bypass()`.
