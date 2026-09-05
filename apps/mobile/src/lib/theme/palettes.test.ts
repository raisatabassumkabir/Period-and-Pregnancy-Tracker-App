import type { PaletteTokens, ThemeMode } from './palettes';
import {
  DEFAULT_PALETTE_ID,
  getPaletteTokens,
  isPaletteId,
  PALETTE_IDS,
  PALETTES,
} from './palettes';
import { resolvePaletteColors } from './use-palette-colors';

const MODES: ThemeMode[] = ['light', 'dark'];
const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

const EXPECTED_TOKENS = [
  '--color-bg',
  '--color-surface',
  '--color-text',
  '--color-divider',
  '--color-accent',
  '--color-accent-2',
  ...STEPS.map((s) => `--color-neutral-${s}`),
  ...STEPS.map((s) => `--color-accent-${s}`),
  ...STEPS.map((s) => `--color-accent-2-${s}`),
];

function channels(value: string): number[] {
  return value.trim().split(/\s+/).map(Number);
}

/** WCAG 2.1 relative luminance. */
function luminance(token: string): number {
  const [r, g, b] = channels(token).map((raw) => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function eachPalette(fn: (tokens: PaletteTokens, label: string) => void) {
  for (const id of PALETTE_IDS) {
    for (const mode of MODES) {
      fn(PALETTES[id][mode], `${id}/${mode}`);
    }
  }
}

describe('palette structure', () => {
  it('exposes exactly six palettes and defaults to organic', () => {
    expect(PALETTE_IDS).toHaveLength(6);
    expect(DEFAULT_PALETTE_ID).toBe('organic');
    expect(PALETTES[DEFAULT_PALETTE_ID]).toBeDefined();
  });

  it('defines every token in both modes for every palette', () => {
    eachPalette((tokens, label) => {
      expect({ label, keys: Object.keys(tokens).sort() }).toEqual({
        label,
        keys: [...EXPECTED_TOKENS].sort(),
      });
    });
  });

  it('stores every value as three in-range sRGB channels', () => {
    eachPalette((tokens, label) => {
      for (const [name, value] of Object.entries(tokens)) {
        const parts = channels(value);
        expect(`${label} ${name} -> ${parts.length} channels`).toBe(
          `${label} ${name} -> 3 channels`
        );
        for (const part of parts) {
          expect(Number.isInteger(part)).toBe(true);
          expect(part).toBeGreaterThanOrEqual(0);
          expect(part).toBeLessThanOrEqual(255);
        }
      }
    });
  });
});

describe('step numbers keep their role across modes', () => {
  // This is the invariant the whole scheme rests on: a screen written once with
  // `bg-tone-100` / `text-tone-900` must read correctly in both themes without
  // a hand-written `dark:` variant. Light ramps descend, dark ramps ascend.
  it.each(['neutral', 'accent', 'accent-2'])(
    'orders the %s ramp light-to-dark in light mode and dark-to-light in dark mode',
    (prefix) => {
      for (const id of PALETTE_IDS) {
        const light = STEPS.map((s) =>
          luminance(PALETTES[id].light[`--color-${prefix}-${s}`])
        );
        const dark = STEPS.map((s) =>
          luminance(PALETTES[id].dark[`--color-${prefix}-${s}`])
        );

        for (let i = 1; i < STEPS.length; i += 1) {
          expect(`${id} light ${prefix} ${STEPS[i]}`).toBe(
            light[i] < light[i - 1]
              ? `${id} light ${prefix} ${STEPS[i]}`
              : 'expected each light step to be darker than the last'
          );
          expect(`${id} dark ${prefix} ${STEPS[i]}`).toBe(
            dark[i] > dark[i - 1]
              ? `${id} dark ${prefix} ${STEPS[i]}`
              : 'expected each dark step to be lighter than the last'
          );
        }
      }
    }
  );
});

describe('contrast', () => {
  it('keeps body text well clear of AAA against the ground and surfaces', () => {
    eachPalette((tokens, label) => {
      expect([
        label,
        contrast(tokens['--color-text'], tokens['--color-bg']) >= 7,
      ]).toEqual([label, true]);
      expect([
        label,
        contrast(tokens['--color-text'], tokens['--color-surface']) >= 7,
      ]).toEqual([label, true]);
    });
  });

  it('keeps muted text and accent-on-tint above AA', () => {
    eachPalette((tokens, label) => {
      // `tone-700` on the ground is the muted-body-copy pairing.
      expect([
        label,
        contrast(tokens['--color-neutral-700'], tokens['--color-bg']) >= 4.5,
      ]).toEqual([label, true]);
      // `accent-700` on `accent-200` is the tinted-chip pairing used throughout.
      expect([
        label,
        contrast(tokens['--color-accent-700'], tokens['--color-accent-200']) >=
          4.5,
      ]).toEqual([label, true]);
      expect([
        label,
        contrast(
          tokens['--color-accent-2-700'],
          tokens['--color-accent-2-200']
        ) >= 4.5,
      ]).toEqual([label, true]);
    });
  });
});

describe('organic light fidelity', () => {
  // The design canvas was authored against these exact values; drifting from
  // them silently un-matches every screen built from it.
  it.each([
    ['--color-bg', '245 234 216'],
    ['--color-surface', '235 221 197'],
    ['--color-text', '32 30 29'],
    ['--color-accent', '198 113 57'],
    ['--color-accent-2', '122 138 94'],
    ['--color-accent-200', '255 225 208'],
    ['--color-accent-700', '140 73 26'],
    ['--color-accent-800', '100 51 18'],
    ['--color-neutral-100', '249 244 237'],
    ['--color-neutral-300', '220 211 196'],
    ['--color-neutral-600', '130 121 106'],
    ['--color-accent-2-500', '143 160 115'],
    ['--color-accent-2-800', '61 71 43'],
  ])('matches the Organic system for %s', (token, expected) => {
    expect(PALETTES.organic.light[token]).toBe(expected);
  });
});

describe('getPaletteTokens', () => {
  it('returns the requested palette and mode', () => {
    expect(getPaletteTokens('teal', 'dark')).toBe(PALETTES.teal.dark);
    expect(getPaletteTokens('rose', 'light')).toBe(PALETTES.rose.light);
  });

  it('falls back to the default palette for an unknown id', () => {
    // A stored id from a future build must not crash an older client.
    expect(getPaletteTokens('chartreuse' as never, 'light')).toBe(
      PALETTES[DEFAULT_PALETTE_ID].light
    );
  });
});

describe('isPaletteId', () => {
  it('accepts known ids and rejects everything else', () => {
    expect(isPaletteId('organic')).toBe(true);
    expect(isPaletteId('slate')).toBe(true);
    expect(isPaletteId('chartreuse')).toBe(false);
    expect(isPaletteId(null)).toBe(false);
    expect(isPaletteId(7)).toBe(false);
  });
});

describe('resolvePaletteColors', () => {
  it('converts channel tokens to hex literals React Native can parse', () => {
    const colors = resolvePaletteColors(PALETTES.organic.light);

    expect(colors.accent).toBe('#c67139');
    expect(colors.canvas).toBe('#f5ead8');
    expect(colors.surface).toBe('#ebddc5');
    expect(colors.ink).toBe('#201e1d');
    expect(colors.tone[100]).toBe('#f9f4ed');
    expect(colors.accentScale[700]).toBe('#8c491a');
    expect(colors.accent2Scale[500]).toBe('#8fa073');
  });

  it('pads single-digit channels', () => {
    expect(resolvePaletteColors({ '--color-bg': '1 2 3' }).canvas).toBe(
      '#010203'
    );
  });

  it('degrades to black on a malformed token rather than throwing', () => {
    expect(resolvePaletteColors({ '--color-bg': 'nonsense' }).canvas).toBe(
      '#000000'
    );
    expect(resolvePaletteColors({}).accent).toBe('#000000');
  });
});
