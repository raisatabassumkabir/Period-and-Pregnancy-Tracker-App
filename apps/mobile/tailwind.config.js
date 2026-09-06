const colors = require('./src/components/ui/colors');

/**
 * Palette-driven semantic colours.
 *
 * These resolve through CSS custom properties set at runtime on the root view
 * (see `src/lib/theme/palettes.ts` and `src/app/_layout.tsx`), which is how the
 * six palettes swap without a rebuild — NativeWind compiles `className` at build
 * time, so the indirection has to live in the variable, not in a JS lookup.
 *
 * Deliberately namespaced away from the legacy `neutral` / `brand` / `primary`
 * scales in `colors.js`: existing screens hand-write `dark:` variants that assume
 * `neutral-900` is dark in both themes, whereas the palette ramps flip so a step
 * keeps its ROLE across modes. Mixing the two conventions under one name would
 * invert those screens.
 */
const palette = {
  canvas: 'rgb(var(--color-bg) / <alpha-value>)',
  surface: 'rgb(var(--color-surface) / <alpha-value>)',
  ink: 'rgb(var(--color-text) / <alpha-value>)',
  divider: 'rgb(var(--color-divider) / <alpha-value>)',
  accent: {
    DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
    100: 'rgb(var(--color-accent-100) / <alpha-value>)',
    200: 'rgb(var(--color-accent-200) / <alpha-value>)',
    300: 'rgb(var(--color-accent-300) / <alpha-value>)',
    400: 'rgb(var(--color-accent-400) / <alpha-value>)',
    500: 'rgb(var(--color-accent-500) / <alpha-value>)',
    600: 'rgb(var(--color-accent-600) / <alpha-value>)',
    700: 'rgb(var(--color-accent-700) / <alpha-value>)',
    800: 'rgb(var(--color-accent-800) / <alpha-value>)',
    900: 'rgb(var(--color-accent-900) / <alpha-value>)',
  },
  accent2: {
    DEFAULT: 'rgb(var(--color-accent-2) / <alpha-value>)',
    100: 'rgb(var(--color-accent-2-100) / <alpha-value>)',
    200: 'rgb(var(--color-accent-2-200) / <alpha-value>)',
    300: 'rgb(var(--color-accent-2-300) / <alpha-value>)',
    400: 'rgb(var(--color-accent-2-400) / <alpha-value>)',
    500: 'rgb(var(--color-accent-2-500) / <alpha-value>)',
    600: 'rgb(var(--color-accent-2-600) / <alpha-value>)',
    700: 'rgb(var(--color-accent-2-700) / <alpha-value>)',
    800: 'rgb(var(--color-accent-2-800) / <alpha-value>)',
    900: 'rgb(var(--color-accent-2-900) / <alpha-value>)',
  },
  /** The palette's neutral ramp. `tone-100` is the base surface tier in BOTH themes. */
  tone: {
    100: 'rgb(var(--color-neutral-100) / <alpha-value>)',
    200: 'rgb(var(--color-neutral-200) / <alpha-value>)',
    300: 'rgb(var(--color-neutral-300) / <alpha-value>)',
    400: 'rgb(var(--color-neutral-400) / <alpha-value>)',
    500: 'rgb(var(--color-neutral-500) / <alpha-value>)',
    600: 'rgb(var(--color-neutral-600) / <alpha-value>)',
    700: 'rgb(var(--color-neutral-700) / <alpha-value>)',
    800: 'rgb(var(--color-neutral-800) / <alpha-value>)',
    900: 'rgb(var(--color-neutral-900) / <alpha-value>)',
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter'],
        // Referenced by PostScript name, which matches each file's basename —
        // the one spelling both iOS and Android resolve. Happy Women uses one
        // rounded family (Nunito) at four weights; the role names stay the
        // same so no screen needed a className change to adopt it.
        heading: ['Nunito-ExtraBold'],
        body: ['Nunito-Regular'],
        'body-semibold': ['Nunito-SemiBold'],
        'body-bold': ['Nunito-Bold'],
      },
      colors: {
        ...colors,
        ...palette,
      },
      borderRadius: {
        // Organic's container scale, under its own names so the stock
        // `rounded-sm/md/lg` keep their existing values on existing screens.
        tile: '8px',
        panel: '16px',
        card: '28px',
        /** Fully rounded regardless of box size — pill buttons and day cells. */
        pill: '999px',
      },
    },
  },
  plugins: [],
};
