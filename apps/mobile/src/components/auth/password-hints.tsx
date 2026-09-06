import { Check } from 'lucide-react-native';
import React from 'react';

import { Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import { PASSWORD_RULES } from '@/hooks/auth-schemas';
import { usePaletteColors } from '@/lib/theme';

const CHECK_SIZE = 13;

interface Props {
  value: string;
}

/**
 * One-line checklist under the new-password field:
 * `✓ 8+ chars  •  ✓ 1 letter  •  ✓ 1 number`. Items wrap on narrow screens;
 * each turns from muted grey to green as its rule is satisfied.
 */
export function PasswordHints({ value }: Props) {
  const palette = usePaletteColors();

  return (
    <View
      className="-mt-1 mb-4 flex-row flex-wrap items-center gap-x-2 gap-y-1"
      testID="password-hints"
    >
      {PASSWORD_RULES.map((rule, index) => {
        const met = rule.isMet(value);
        return (
          <React.Fragment key={rule.id}>
            {index > 0 && (
              <Text className="text-[12px] text-tone-500" accessible={false}>
                •
              </Text>
            )}
            <View
              className="flex-row items-center gap-1"
              testID={`password-rule-${rule.id}-${met ? 'met' : 'unmet'}`}
              accessibilityLabel={`${rule.label}: ${met ? 'met' : 'not met'}`}
            >
              <Check
                size={CHECK_SIZE}
                strokeWidth={3}
                color={met ? colors.success[500] : palette.tone[400]}
              />
              <Text
                // Colour-only toggle; never a runtime-toggled shadow class.
                className={`text-[13px] ${
                  met ? 'font-body-semibold text-success-500' : 'text-tone-500'
                }`}
              >
                {rule.label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}
