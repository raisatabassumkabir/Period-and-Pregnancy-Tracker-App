"""
Base settings. Environment-specific overrides live in dev.py / test.py / prod.py.

Portability rule (ARCHITECTURE §2): everything host-specific comes in through
DATABASE_URL, REDIS_URL and plain env vars. No Heroku or Hetzner APIs in here.
"""

import os
import sys
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env.local")

SECRET_KEY = os.environ.get("SECRET_KEY", "insecure-dev-only-key")
DEBUG = False
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h.strip()]

# A non-guessable admin path in prod keeps the login page off scanners' lists.
# Must end with "/"; RLSMiddleware scopes the staff bypass to this prefix.
ADMIN_URL = os.environ.get("ADMIN_URL", "admin/")
# Schema + Swagger UI are a map of every endpoint; only expose them where wanted.
API_DOCS_ENABLED = os.environ.get("API_DOCS_ENABLED", "false").lower() == "true"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third party
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "anymail",
    # local
    "apps.core",
    "apps.users",
    "apps.cycles",
    "apps.pregnancy",
    "apps.payments",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Must run AFTER AuthenticationMiddleware (it reads request.user for the
    # session-authenticated admin path) and must be the innermost middleware so
    # the whole view executes inside its transaction. See apps/core/middleware.py.
    "apps.core.middleware.RLSMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Persistent connections are safe with RLS because set_config(..., is_local=true)
# is transaction-scoped: the variable dies with the request's transaction and can
# never leak onto the next request that reuses this pooled connection.
DATABASES = {
    "default": dj_database_url.config(
        default="postgres://femtech:femtech@localhost:5432/femtech",
        conn_max_age=60,
        conn_health_checks=True,
    )
}

if 'test' in sys.argv:
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }

AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATIC_ROOT.mkdir(parents=True, exist_ok=True)

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Deny by default; views opt into anything looser explicitly.
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "EXCEPTION_HANDLER": "apps.core.exceptions.problem_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    # Auth scopes are tight because they guard credential guessing, sign-up
    # spam and reset-email floods; views opt in via throttle_scope.
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",
        "user": "300/min",
        "auth-token": "10/min",
        "auth-register": "5/hour",
        "password-reset": "5/hour",
    },
    # Traefik appends the client IP to X-Forwarded-For. Without this DRF keys
    # every throttle on the proxy's address and one client throttles everyone.
    "NUM_PROXIES": int(os.environ.get("DRF_NUM_PROXIES", "1")),
}

SIMPLE_JWT = {
    # Short-lived access + rotating refresh, per ARCHITECTURE §4.
    # The mobile client stores the refresh token in expo-secure-store.
    # Overridable so staging can exercise the refresh path with 1-minute tokens.
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.environ.get("JWT_ACCESS_MINUTES", "15"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Femtech API",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TASK_ALWAYS_EAGER = False

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
]
CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()
]

# RevenueCat subscription management & webhook integration
REVENUECAT_SECRET_API_KEY = os.environ.get("REVENUECAT_SECRET_API_KEY", "")
# Canonical authorization secret, with fallback to legacy REVENUECAT_WEBHOOK_SECRET
REVENUECAT_WEBHOOK_AUTHORIZATION = (
    os.environ.get("REVENUECAT_WEBHOOK_AUTHORIZATION")
    or os.environ.get("REVENUECAT_WEBHOOK_SECRET", "")
)
REVENUECAT_API_BASE_URL = os.environ.get(
    "REVENUECAT_API_BASE_URL", "https://api.revenuecat.com/v1"
)
# Keep below the mobile client's 15s request timeout so a slow upstream fails
# here first and the app gets a real response instead of its own timeout.
REVENUECAT_REQUEST_TIMEOUT_SECONDS = int(
    os.environ.get("REVENUECAT_REQUEST_TIMEOUT_SECONDS", "5")
)

# Transactional email (password resets). Console locally; prod.py swaps in
# Resend through django-anymail.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "Happy Women <no-reply@localhost>")
# Absolute origin for links inside emails. prod.py derives it from DOMAIN.
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000")
# Reset links expire after an hour, and die on first use because the token
# hashes the current password.
PASSWORD_RESET_TIMEOUT = 60 * 60

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "plain": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "plain"},
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        # Without this, DEBUG=False routes request tracebacks only to
        # mail_admins, and with no ADMINS configured they vanish.
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
    },
}
