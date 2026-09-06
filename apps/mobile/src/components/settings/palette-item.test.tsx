import React from 'react';

import { clear, getItem, setItem } from '@/lib/storage';
import { cleanup, render, screen, setup, waitFor } from '@/lib/test-utils';
import {
  DEFAULT_PALETTE_ID,
  loadSelectedPalette,
  PALETTE_IDS,
  PALETTES,
  usePaletteStore,
} from '@/lib/theme';

import { PaletteItem } from './palette-item';

const STORAGE_KEY = '@app/selected_palette';

afterEach(() => {
  cleanup();
  // The store is module-level, so it leaks between tests unless reset.
  usePaletteStore.setState({ paletteId: DEFAULT_PALETTE_ID, hydrated: false });
});

beforeEach(async () => {
  await clear();
  jest.clearAllMocks();
});

describe('PaletteItem', () => {
  it('shows the active palette label on the settings row', () => {
    render(<PaletteItem />);

    expect(screen.getByTestId('settings-palette-row-value')).toHaveTextContent(
      PALETTES[DEFAULT_PALETTE_ID].label
    );
  });

  it('reflects a palette selected elsewhere', () => {
    usePaletteStore.setState({ paletteId: 'teal', hydrated: true });
    render(<PaletteItem />);

    expect(screen.getByTestId('settings-palette-row-value')).toHaveTextContent(
      PALETTES.teal.label
    );
  });

  it('offers every palette in the picker', async () => {
    const { user } = setup(<PaletteItem />);

    await user.press(screen.getByTestId('settings-palette-row'));

    for (const id of PALETTE_IDS) {
      expect(screen.getByTestId(`palette-option-${id}`)).toBeOnTheScreen();
    }
  });

  it('applies the chosen palette and persists it', async () => {
    const { user } = setup(<PaletteItem />);

    await user.press(screen.getByTestId('settings-palette-row'));
    await user.press(screen.getByTestId('palette-option-rose'));

    expect(usePaletteStore.getState().paletteId).toBe('rose');
    await waitFor(async () => {
      expect(await getItem<string>(STORAGE_KEY)).toBe('rose');
    });
  });
});

describe('loadSelectedPalette', () => {
  it('restores a stored palette', async () => {
    await setItem(STORAGE_KEY, 'slate');

    await loadSelectedPalette();

    expect(usePaletteStore.getState().paletteId).toBe('slate');
    expect(usePaletteStore.getState().hydrated).toBe(true);
  });

  it('falls back to the default when nothing is stored', async () => {
    await loadSelectedPalette();

    expect(usePaletteStore.getState().paletteId).toBe(DEFAULT_PALETTE_ID);
  });

  it('ignores a stored id this build does not know', async () => {
    // Downgrading past a palette that shipped later must not brick theming.
    await setItem(STORAGE_KEY, 'chartreuse');

    await loadSelectedPalette();

    expect(usePaletteStore.getState().paletteId).toBe(DEFAULT_PALETTE_ID);
  });
});
