import { useColorScheme } from 'nativewind';
import React from 'react';

import type { PaletteId, PaletteTokens, ThemeMode } from './palettes';
import { getPaletteTokens } from './palettes';
import { usePaletteStore } from './use-selected-palette';

const RAMP_STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export type RampStep = (typeof RAMP_STEPS)[number];
export type Ramp = Record<RampStep, string>;

export interface PaletteColors {
  canvas: string;
  surface: string;
  ink: string;
  divider: string;
  accent: string;
  accent2: string;
  /** The palette's neutral ramp. `tone[100]` is the base surface tier in both modes. */
  tone: Ramp;
  accentScale: Ramp;
  accent2Scale: Ramp;
}

/**
 * `'198 113 57'` -> `'#c67139'`.
 *
 * Tokens are stored as sRGB channels so Tailwind's `<alpha-value>` works through
 * the CSS variable, but React Native's colour parser wants a literal — and it
 * does not accept the space-separated `rgb()` form CSS allows.
 */
function channelsToHex(channels: string): string {
  const parts = channels.trim().split(/\s+/);
  if (parts.length < 3) return '#000000';

  return `#${parts
    .slice(0, 3)
    .map((part) => {
      const value = Math.max(0, Math.min(255, Number(part) || 0));
      return value.toString(16).padStart(2, '0');
    })
    .join('')}`;
}

function ramp(tokens: PaletteTokens, prefix: string): Ramp {
  return RAMP_STEPS.reduce((acc, step) => {
    acc[step] = channelsToHex(tokens[`--color-${prefix}-${step}`] ?? '');
    return acc;
  }, {} as Ramp);
}

export function resolvePaletteColors(tokens: PaletteTokens): PaletteColors {
  return {
    canvas: channelsToHex(tokens['--color-bg'] ?? ''),
    surface: channelsToHex(tokens['--color-surface'] ?? ''),
    ink: channelsToHex(tokens['--color-text'] ?? ''),
    divider: channelsToHex(tokens['--color-divider'] ?? ''),
    accent: channelsToHex(tokens['--color-accent'] ?? ''),
    accent2: channelsToHex(tokens['--color-accent-2'] ?? ''),
    tone: ramp(tokens, 'neutral'),
    accentScale: ramp(tokens, 'accent'),
    accent2Scale: ramp(tokens, 'accent-2'),
  };
}

/**
 * Resolved palette colours for places that need a literal rather than a
 * `className`: icon `color` props, `ActivityIndicator`, `RefreshControl`,
 * SVG fills, bottom-sheet `backgroundStyle`, and the navigator's own chrome.
 *
 * Prefer the Tailwind classes (`bg-surface`, `text-ink`, `text-accent-700`)
 * wherever a `className` will do — they resolve through the same variables
 * without a re-render.
 */
export function usePaletteColors(): PaletteColors {
  const paletteId: PaletteId = usePaletteStore.use.paletteId();
  const { colorScheme } = useColorScheme();
  const mode: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';

  return React.useMemo(
    () => resolvePaletteColors(getPaletteTokens(paletteId, mode)),
    [paletteId, mode]
  );
}
