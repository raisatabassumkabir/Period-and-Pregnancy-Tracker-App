import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import { resources } from './resources';
import { getLanguage } from './utils';
export * from './utils';

// Get device locale for SDK 54+
const deviceLocale = getLocales()[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLocale, // Initialize with device locale, will be updated when stored language loads
  fallbackLng: 'en',
  compatibilityJSON: 'v3', // By default React Native projects does not support Intl

  // allows integrating dynamic values into translations.
  interpolation: {
    escapeValue: false, // escape passed in values to avoid XSS injections
  },
});

// Load stored language and update i18n
getLanguage().then((storedLanguage) => {
  if (storedLanguage) {
    i18n.changeLanguage(storedLanguage);
  }
});

// Is it a RTL language?
export const isRTL: boolean = i18n.dir() === 'rtl';

I18nManager.allowRTL(isRTL);
I18nManager.forceRTL(isRTL);

export default i18n;
