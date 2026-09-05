import { Env } from '@env';
import { Linking, Platform, Share } from 'react-native';

const PLAY_STORE_WEB_URL = 'https://play.google.com/store/apps/details?id=';
const PLAY_STORE_APP_URL = 'market://details?id=';

export const storeListingUrl = (): string =>
  `${PLAY_STORE_WEB_URL}${Env.PACKAGE}`;

export const openPrivacyPolicy = (): Promise<void> =>
  Linking.openURL(Env.PRIVACY_POLICY_URL);

export const openTerms = (): Promise<void> => Linking.openURL(Env.TERMS_URL);

export const openSupportEmail = (): Promise<void> => {
  const subject = encodeURIComponent(`${Env.NAME} support (v${Env.VERSION})`);
  return Linking.openURL(`mailto:${Env.SUPPORT_EMAIL}?subject=${subject}`);
};

/** Deep-link into the Play Store app when present; fall back to the web listing. */
export const openStoreListing = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    const appUrl = `${PLAY_STORE_APP_URL}${Env.PACKAGE}`;
    if (await Linking.canOpenURL(appUrl)) {
      await Linking.openURL(appUrl);
      return;
    }
  }
  await Linking.openURL(storeListingUrl());
};

export const shareApp = (): Promise<unknown> =>
  Share.share({
    message: `Check out ${Env.NAME}: ${storeListingUrl()}`,
  });
