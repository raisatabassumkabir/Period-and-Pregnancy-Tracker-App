import React from 'react';
import { View } from 'react-native';

const PERCENT = 100;

interface ProgressTrackProps {
  /** 0–100. Clamped, so an out-of-range server value cannot overflow the track. */
  percent: number;
  /** Tailwind background class for the fill — accent by default. */
  fillClassName?: string;
  /** Tailwind background class for the trough. */
  trackClassName?: string;
  className?: string;
  testID?: string;
}

/**
 * A static percentage bar. Distinct from `ProgressBar`, which animates through
 * an imperative ref: this renders a value that is already known.
 */
export function ProgressTrack({
  percent,
  fillClassName = 'bg-accent',
  trackClassName = 'bg-tone-300',
  className = 'h-2 w-full',
  testID,
}: ProgressTrackProps) {
  const clamped = Math.min(PERCENT, Math.max(0, percent));

  return (
    <View
      testID={testID}
      className={`overflow-hidden rounded-full ${trackClassName} ${className}`}
    >
      <View
        className={`h-full rounded-full ${fillClassName}`}
        style={{ width: `${clamped}%` }}
      />
    </View>
  );
}
