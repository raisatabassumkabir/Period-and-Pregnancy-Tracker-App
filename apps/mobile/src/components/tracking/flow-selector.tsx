import React from 'react';

import type { Flow } from '@/api/cycles/types';
import type { PillOption } from '@/components/ui';
import { OptionPills } from '@/components/ui';

const FLOW_OPTIONS: readonly PillOption<Flow>[] = [
  { value: 'none', label: 'None' },
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

interface Props {
  value: Flow;
  onChange: (value: Flow) => void;
}

export function FlowSelector({ value, onChange }: Props) {
  return (
    <OptionPills
      options={FLOW_OPTIONS}
      value={value}
      onChange={onChange}
      accessibilityLabel="Menstrual flow"
      testID="flow-selector"
    />
  );
}
