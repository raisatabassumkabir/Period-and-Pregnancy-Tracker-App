from .base import *  # noqa: F403

DEBUG = False
SECRET_KEY = "test-only-key-long-enough-for-hmac-sha256-minimum"

# Fast hashing; these hashes never leave the test database.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

CELERY_TASK_ALWAYS_EAGER = True

CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
