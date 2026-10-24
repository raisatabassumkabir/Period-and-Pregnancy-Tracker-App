import logging

from celery import shared_task

from apps.payments.models import WebhookEvent
from apps.payments.services import process_webhook_event_record

logger = logging.getLogger(__name__)

# The webhook enqueues on commit, so a missing row should be rare: a replica lag
# or a manual re-enqueue. Retry briefly instead of dropping the event.
EVENT_NOT_VISIBLE_RETRY_SECONDS = 10


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_revenuecat_event(self, event_id: str) -> bool:
    """
    Celery task for reliable, asynchronous processing of RevenueCat webhook events.
    """
    try:
        event = WebhookEvent.objects.filter(event_id=event_id).first()
        if not event:
            logger.warning("WebhookEvent %s not found yet; retrying.", event_id)
            raise self.retry(countdown=EVENT_NOT_VISIBLE_RETRY_SECONDS)

        # Idempotency check: do not re-process already processed events
        if event.status == WebhookEvent.Status.PROCESSED:
            logger.info("WebhookEvent %s already processed; skipping.", event_id)
            return True

        success, message = process_webhook_event_record(event)
        if not success:
            logger.warning("WebhookEvent %s failed: %s. Retrying...", event_id, message)
            raise self.retry(countdown=60 * (2 ** self.request.retries))

        return True
    except WebhookEvent.DoesNotExist:
        logger.error("WebhookEvent %s does not exist.", event_id)
        return False
    except Exception as exc:
        if getattr(self, "request", None) and self.request.retries >= self.max_retries:
            logger.error(
                "WebhookEvent %s permanently failed after max retries: %s",
                event_id,
                exc,
                exc_info=True,
            )
            event = WebhookEvent.objects.filter(event_id=event_id).first()
            if event:
                event.status = WebhookEvent.Status.FAILED
                event.error_message = f"Max retries exceeded: {exc}"[:500]
                event.save(update_fields=["status", "error_message", "updated_at"])
            return False
        raise
