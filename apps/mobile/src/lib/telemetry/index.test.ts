import * as amplitude from '@amplitude/analytics-react-native';
import { SessionReplayPlugin } from '@amplitude/plugin-session-replay-react-native';

import {
  identifyUser,
  initTelemetry,
  isTelemetryInitialized,
  resetTelemetryUser,
  setUserProperties,
  trackEvent,
} from './index';

describe('telemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes Amplitude and adds SessionReplayPlugin', async () => {
    const success = await initTelemetry('test-api-key');

    expect(success).toBe(true);
    expect(amplitude.init).toHaveBeenCalledWith('test-api-key');
    expect(amplitude.add).toHaveBeenCalled();
    expect(SessionReplayPlugin).toHaveBeenCalled();
    expect(isTelemetryInitialized()).toBe(true);
  });

  it('tracks events with properties', () => {
    trackEvent('Button Clicked', { buttonColor: 'primary' });

    expect(amplitude.track).toHaveBeenCalledWith('Button Clicked', {
      buttonColor: 'primary',
    });
  });

  it('identifies user with properties', () => {
    identifyUser('user-123', { plan: 'pro', email: 'user@example.com' });

    expect(amplitude.setUserId).toHaveBeenCalledWith('user-123');
    expect(amplitude.identify).toHaveBeenCalled();
  });

  it('sets user properties without changing userId', () => {
    setUserProperties({ streakDays: 5 });

    expect(amplitude.identify).toHaveBeenCalled();
  });

  it('resets user on logout', () => {
    resetTelemetryUser();

    expect(amplitude.reset).toHaveBeenCalled();
  });
});
