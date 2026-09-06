import React from 'react';

import { cleanup, screen, setup } from '@/lib/test-utils';

import { weekContaining, WeekStrip } from './week-strip';

afterEach(cleanup);

describe('weekContaining', () => {
  it('returns the Monday-first week around the anchor', () => {
    // 2026-03-05 is a Thursday.
    expect(weekContaining('2026-03-05')).toEqual([
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
    ]);
  });

  it('starts on the anchor itself when it is a Monday', () => {
    expect(weekContaining('2026-03-02')[0]).toBe('2026-03-02');
  });
});

describe('WeekStrip', () => {
  it('renders seven days and reports the tapped date', async () => {
    const onSelect = jest.fn();
    const { user } = setup(
      <WeekStrip
        today="2026-03-05"
        selectedDate="2026-03-05"
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId('week-strip').children).toHaveLength(7);
    await user.press(screen.getByTestId('week-day-2026-03-07'));
    expect(onSelect).toHaveBeenCalledWith('2026-03-07');
  });
});
