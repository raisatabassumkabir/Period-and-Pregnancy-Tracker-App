import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Path } from 'react-native-svg';

import type { Trimester } from '@/lib/health';

interface Props extends SvgProps {
  trimester: Trimester;
  size?: number;
  color?: string;
}

/** The figure grows with each trimester so the ring's centre visibly changes. */
const SCALE_BY_TRIMESTER: Record<Trimester, number> = { 1: 0.7, 2: 0.85, 3: 1 };

/**
 * Placeholder baby glyph for the pregnancy ring's centre. Replace with the
 * per-week development artwork; keep the props contract.
 */
export const BabyStageGlyph = ({
  trimester,
  size = 48,
  color = '#FF7575',
  ...props
}: Props) => {
  const scale = SCALE_BY_TRIMESTER[trimester];
  const drawn = size * scale;

  return (
    <Svg
      width={drawn}
      height={drawn}
      viewBox="0 0 48 48"
      fill="none"
      {...props}
    >
      <Circle cx={24} cy={16} r={9} stroke={color} strokeWidth={3} />
      <Path
        d="M14 42c0-7 4.5-12 10-12s10 5 10 12"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx={20.5} cy={15} r={1.5} fill={color} />
      <Circle cx={27.5} cy={15} r={1.5} fill={color} />
      <Path
        d="M21 20c1.5 1.5 4.5 1.5 6 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
};
