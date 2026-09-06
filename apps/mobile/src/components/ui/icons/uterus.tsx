import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props extends SvgProps {
  size?: number;
  color?: string;
}

/**
 * Placeholder uterus glyph for the cycle ring's centre. Swap the paths for the
 * final brand artwork; keep the `size` / `color` contract so the ring needs no
 * change.
 */
export const UterusGlyph = ({
  size = 48,
  color = '#FF7575',
  ...props
}: Props) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" {...props}>
    <Path
      d="M24 14c-3.5-4.5-9-6-13-3.5C6.5 13.5 6 20 10 24l6 5c2 1.7 3 4 3 6.5V40h10v-4.5c0-2.5 1-4.8 3-6.5l6-5c4-4 3.5-10.5-1-13.5-4-2.5-9.5-1-13 3.5Z"
      stroke={color}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <Circle cx={9} cy={13} r={3.5} fill={color} />
    <Circle cx={39} cy={13} r={3.5} fill={color} />
  </Svg>
);
