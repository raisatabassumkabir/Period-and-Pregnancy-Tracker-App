from django.contrib import admin

from apps.payments.models import Subscription, WebhookEvent


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "status",
        "is_active",
        "product_id",
        "store",
        "expires_at",
        "last_synced_at",
    )
    list_filter = ("status", "is_active", "store", "is_sandbox")
    search_fields = ("user__email", "rc_app_user_id", "product_id")
    readonly_fields = ("created_at", "updated_at")


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = (
        "event_id",
        "event_type",
        "app_user_id",
        "status",
        "created_at",
        "processed_at",
    )
    list_filter = ("status", "event_type")
    search_fields = ("event_id", "app_user_id")
    readonly_fields = ("created_at", "updated_at")
