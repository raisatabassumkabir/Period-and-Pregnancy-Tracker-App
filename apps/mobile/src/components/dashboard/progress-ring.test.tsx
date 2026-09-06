import React from 'react';

import { Text } from '@/components/ui';
import { cleanup, render, screen } from '@/lib/test-utils';

import { ProgressRing } from './progress-ring';

afterEach(cleanup);

describe('ProgressRing', () => {
  it('renders its centre content inside the ring container', () => {
    render(
      <ProgressRing
        progress={0.5}
        color="#ff7575"
        trackColor="#1e1e1e"
        testID="ring"
      >
        <Text testID="ring-value">14</Text>
      </ProgressRing>
    );

    expect(screen.getByTestId('ring')).toBeOnTheScreen();
    expect(screen.getByTestId('ring-value')).toHaveTextContent('14');
  });

  it('tolerates out-of-range progress and empty segments', () => {
    render(
      <ProgressRing
        progress={7}
        color="#ff7575"
        trackColor="#1e1e1e"
        segments={[{ start: 0.6, end: 0.2, color: '#98fb98' }]}
        testID="ring"
      />
    );

    expect(screen.getByTestId('ring')).toBeOnTheScreen();
  });
});
