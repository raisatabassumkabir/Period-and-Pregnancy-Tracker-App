import { useRootNavigationState } from 'expo-router';

import { useAuth } from '../auth';
import { usePaletteStore } from '../theme';
import { useIsFirstTime } from './use-is-first-time';

/**
 * True once every piece of startup work the first frame depends on has landed:
 * the secure-store token read, the persisted palette, the first-launch flag and
 * the router's own state. The root layout holds the splash until then, so the
 * user never sees an unstyled frame or a flash of the wrong screen.
 *
 * Fonts are absent on purpose. They are embedded natively by the `expo-font`
 * config plugin (see `app.config.ts`), so they are registered before JS runs
 * and there is nothing to await — a `useFonts` call here would load them a
 * second time.
 */
export function useAppReady(): boolean {
  const status = useAuth.use.status();
  const isPaletteHydrated = usePaletteStore.use.hydrated();
  const navigationState = useRootNavigationState();
  const [, , isFirstTimeReady] = useIsFirstTime();

  return (
    status !== 'idle' &&
    isPaletteHydrated &&
    isFirstTimeReady &&
    Boolean(navigationState?.key)
  );
}
