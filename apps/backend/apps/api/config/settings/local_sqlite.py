"""
Dev-only settings: run the API on SQLite with no Docker, Postgres or Redis.

Purpose is local UI work against the Expo client when the compose stack isn't
available. Untracked and dev-only by design.

SECURITY: this disables row-level security (defence layer 2) — SQLite has no
RLS, and the policies in the initial migrations are skipped (see MIGRATION_MODULES
below). Layer 1 still holds: every viewset queries through
`OwnedQuerySet.for_user()` (apps/core/models.py), so a user still cannot read
another user's rows and cross-user access still 404s. Never point this at real
data, and never use it as a base for a deployed environment.

Run with:
    $env:DJANGO_SETTINGS_MODULE = "config.settings.local_sqlite"
    uv run manage.py migrate --run-syncdb
    uv run manage.py seed_dev
    uv run manage.py runserver 0.0.0.0:8000
"""

from django.db.backends.signals import connection_created

from .dev import *  # noqa: F403

# The Android emulator reaches the host through the 10.0.2.2 alias, so requests
# from the app arrive with `Host: 10.0.2.2:8000`. dev.py only allows
# localhost/127.0.0.1, which would reject them with DisallowedHost.
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "10.0.2.2", "0.0.0.0"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
    }
}

# base.py points both of these at Redis. Nothing in the codebase calls the cache
# or defines a Celery task, but keeping them local means an absent Redis can
# never surface as a confusing connection error.
CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
}
CELERY_TASK_ALWAYS_EAGER = True

# Each of these apps' 0001_initial ends with a RunSQL block of Postgres-only DDL
# (ENABLE ROW LEVEL SECURITY / CREATE POLICY / current_setting(...)::uuid) that
# SQLite cannot parse. Marking them unmigrated makes `migrate --run-syncdb`
# create the tables straight from the models and skip that SQL entirely.
MIGRATION_MODULES = {
    "users": None,
    "cycles": None,
    "pregnancy": None,
}


def _install_sqlite_rls_shim(sender, connection, **kwargs):
    """
    Give SQLite a no-op `set_config`.

    `apps.core.middleware.RLSMiddleware` calls set_config() on every request and
    `RegisterSerializer.create()` wraps the profile INSERT in `rls_user(...)`, so
    registration hits it too. Registering a 3-argument stub lets that SQL run
    verbatim instead of forcing edits to tracked application code.
    """
    if connection.vendor == "sqlite":
        connection.connection.create_function("set_config", 3, lambda *args: "")


connection_created.connect(_install_sqlite_rls_shim)
