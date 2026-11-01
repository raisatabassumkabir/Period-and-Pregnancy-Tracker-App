import React from 'react';
import { Text as RNText } from 'react-native';

import { View } from '@/components/ui';

import { CALENDAR_FACE_EMOJIS, CALENDAR_FACE_TEXT_STYLE } from './month-grid';

/**
 * Draws every calendar emoji once, beneath the tab screens, as soon as the
 * signed-in shell mounts. The first emoji Android draws has to load the
 * colour-emoji font and rasterise each glyph, which is why the month grid's
 * faces used to appear a beat after the grid. Doing that work here, ahead of
 * time, lets the calendar paint them in the same frame as the circles.
 *
 * Not `opacity: 0`: Android skips drawing fully transparent views, which would
 * skip the warm-up too. It is rendered before the navigator, so the opaque
 * screens cover it, and it is hidden from touch and screen readers.
 */
export function CalendarEmojiWarmup() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute left-0 top-0"
      testID="calendar-emoji-warmup"
    >
      <RNText style={CALENDAR_FACE_TEXT_STYLE}>{CALENDAR_FACE_EMOJIS}</RNText>
    </View>
  );
}
