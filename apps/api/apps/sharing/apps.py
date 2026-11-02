from django.apps import AppConfig


class SharingConfig(AppConfig):
    name = "apps.sharing"
    label = "sharing"

    def ready(self):
        from apps.sharing import signals  # noqa: F401  (registers receivers)
