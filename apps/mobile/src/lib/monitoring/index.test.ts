import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

import { scrubBreadcrumb, scrubEvent } from './index';

describe('crash reporting scrubbers', () => {
  it.each(['console', 'touch', 'ui.click', 'ui.input'])(
    'drops %s breadcrumbs, which can carry response bodies or tapped labels',
    (category) => {
      expect(scrubBreadcrumb({ category, message: 'Cramps' })).toBeNull();
    }
  );

  it('keeps navigation and http breadcrumbs', () => {
    const navigation: Breadcrumb = {
      category: 'navigation',
      data: { to: '/' },
    };
    const http: Breadcrumb = {
      category: 'xhr',
      data: { url: '/api/v1/me/', status_code: 500 },
    };
    expect(scrubBreadcrumb(navigation)).toBe(navigation);
    expect(scrubBreadcrumb(http)).toBe(http);
  });

  it('strips request bodies and cookies from events', () => {
    const event = {
      type: undefined,
      request: {
        url: '/api/v1/daily-logs/',
        data: { symptoms: ['cramps'] },
        cookies: { sessionid: 'abc' },
      },
    } as ErrorEvent;

    const scrubbed = scrubEvent(event);

    expect(scrubbed.request?.data).toBeUndefined();
    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.url).toBe('/api/v1/daily-logs/');
  });
});
