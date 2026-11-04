import { useFonts } from 'expo-font';
import { useRootNavigationState } from 'expo-router';

import { useAuth } from '../auth';
import { usePaletteStore } from '../theme';
import { useIsFirstTime } from './use-is-first-time';

/** Loaded at runtime; the Nunito body fonts are embedded natively. */
const DISPLAY_FONTS = {
  'Fraunces-SemiBold': require('../../../assets/fonts/Fraunces-SemiBold.ttf'),
};

/**
 * True once every piece of startup work the first frame depends on has landed:
 * the secure-store token read, the persisted palette, the first-launch flag and
 * the router's own state. The root layout holds the splash until then, so the
 * user never sees an unstyled frame or a flash of the wrong screen.
 *
 * The Nunito body fonts are embedded natively, so they are registered before
 * JS runs. The Fraunces display face is loaded here at runtime; a failed load
 * still lets the app start (titles fall back to the system font).
 */
export function useAppReady(): boolean {
  const status = useAuth.use.status();
  const isPaletteHydrated = usePaletteStore.use.hydrated();
  const navigationState = useRootNavigationState();
  const [, , isFirstTimeReady] = useIsFirstTime();
  const [displayFontLoaded, displayFontError] = useFonts(DISPLAY_FONTS);

  return (
    status !== 'idle' &&
    isPaletteHydrated &&
    isFirstTimeReady &&
    (displayFontLoaded || !!displayFontError) &&
    Boolean(navigationState?.key)
  );
}
