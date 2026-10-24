import { Env } from '@env';
import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';
import * as Sentry from '@sentry/react-native';

/**
 * Crash and error reporting (Sentry). Every screen in this app shows
 * reproductive-health data, so the rule is: stack traces and device context
 * leave the phone, user content never does.
 *
 * - No screenshots, view hierarchy, session replay or tracing.
 * - No console breadcrumbs: the API client logs response bodies.
 * - No touch/UI breadcrumbs: they carry the label of what was tapped
 *   ("Cramps", "Spotting").
 * - Request bodies are stripped from any event that has one.
 */

const DROPPED_BREADCRUMB_CATEGORIES = new Set(['console', 'touch']);
const UI_BREADCRUMB_PREFIX = 'ui.';

let isInitialized = false;

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  const category = breadcrumb.category ?? '';
  if (DROPPED_BREADCRUMB_CATEGORIES.has(category)) return null;
  if (category.startsWith(UI_BREADCRUMB_PREFIX)) return null;
  return breadcrumb;
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
  }
  return event;
}

/** Off in dev and whenever SENTRY_DSN is empty, so local work never reports. */
export function initCrashReporting(): boolean {
  if (isInitialized) return true;
  if (__DEV__ || !Env.SENTRY_DSN) return false;

  Sentry.init({
    dsn: Env.SENTRY_DSN,
    environment: Env.APP_ENV,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: 0,
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend: scrubEvent,
  });
  isInitialized = true;
  return true;
}

export function captureException(error: unknown, boundary?: string): void {
  if (!isInitialized) return;
  Sentry.captureException(error, boundary ? { tags: { boundary } } : undefined);
}
