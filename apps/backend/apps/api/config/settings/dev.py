from .base import *  # noqa: F403

DEBUG = True
ALLOWED_HOSTS = ['10.0.2.2', 'localhost', '127.0.0.1', '*']

# Browsable API + session login for humans poking at endpoints locally.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
}

CORS_ALLOW_ALL_ORIGINS = True
