import os

from .base import *  # noqa: F403

DEBUG = False

# Fail loudly if the secret key wasn't provided.
SECRET_KEY = os.environ["SECRET_KEY"]

SECURE_SSL_REDIRECT = False  # Caddy terminates TLS and redirects; don't double up.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
