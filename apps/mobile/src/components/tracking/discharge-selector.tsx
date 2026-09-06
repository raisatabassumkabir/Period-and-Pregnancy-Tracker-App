import React from 'react';

import { OptionPills } from '@/components/ui';
import type { Discharge } from '@/lib/tracking';
import { DISCHARGE_OPTIONS } from '@/lib/tracking';

interface Props {
  value: Discharge;
  onChange: (value: Discharge) => void;
}

/** Stored on-device only until the backend's `DailyLog` grows the column. */
export function DischargeSelector({ value, onChange }: Props) {
  return (
    <OptionPills
      options={DISCHARGE_OPTIONS}
      value={value}
      onChange={onChange}
      accessibilityLabel="Vaginal discharge"
      testID="discharge-selector"
    />
  );
}
