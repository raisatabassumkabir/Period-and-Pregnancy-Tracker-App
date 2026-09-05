import { Linking, Platform, Share } from 'react-native';

import {
  openPrivacyPolicy,
  openStoreListing,
  openSupportEmail,
  openTerms,
  shareApp,
} from './external-links';

jest.mock('@env', () => ({
  Env: {
    NAME: 'AppTemplate',
    VERSION: '0.1.0',
    PACKAGE: 'com.example.app',
    PRIVACY_POLICY_URL: 'https://app.example/privacy',
    TERMS_URL: 'https://app.example/terms',
    SUPPORT_EMAIL: 'help@app.example',
  },
}));

const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
const canOpenURL = jest.spyOn(Linking, 'canOpenURL');
const share = jest
  .spyOn(Share, 'share')
  .mockResolvedValue({ action: 'sharedAction' });

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'android';
});

describe('external links', () => {
  it('opens the privacy policy and terms from env', async () => {
    await openPrivacyPolicy();
    await openTerms();
    expect(openURL).toHaveBeenNthCalledWith(1, 'https://app.example/privacy');
    expect(openURL).toHaveBeenNthCalledWith(2, 'https://app.example/terms');
  });

  it('composes a support email with app name and version', async () => {
    await openSupportEmail();
    expect(openURL).toHaveBeenCalledWith(
      'mailto:help@app.example?subject=AppTemplate%20support%20(v0.1.0)'
    );
  });

  it('prefers the Play Store app for ratings', async () => {
    canOpenURL.mockResolvedValue(true);
    await openStoreListing();
    expect(openURL).toHaveBeenCalledWith('market://details?id=com.example.app');
  });

  it('falls back to the web listing when the store app is missing', async () => {
    canOpenURL.mockResolvedValue(false);
    await openStoreListing();
    expect(openURL).toHaveBeenCalledWith(
      'https://play.google.com/store/apps/details?id=com.example.app'
    );
  });

  it('shares the store link', async () => {
    await shareApp();
    expect(share).toHaveBeenCalledWith({
      message: expect.stringContaining(
        'https://play.google.com/store/apps/details?id=com.example.app'
      ),
    });
  });
});
