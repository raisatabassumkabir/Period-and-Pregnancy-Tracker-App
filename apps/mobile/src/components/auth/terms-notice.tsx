import React from 'react';

import { Text } from '@/components/ui';
import { openPrivacyPolicy, openTerms } from '@/lib/external-links';

interface Props {
  className?: string;
}

/** "By continuing, you agree to…" with tappable Terms and Privacy links. */
export function TermsNotice({ className = '' }: Props) {
  return (
    <Text
      className={`text-center text-[12px] leading-[18px] text-tone-500 ${className}`}
      testID="terms-notice"
    >
      By continuing, you agree to our{' '}
      <Text
        accessibilityRole="link"
        onPress={() => void openTerms()}
        className="font-body-semibold text-[12px] text-accent-700 underline"
        testID="terms-link"
      >
        Terms of Service
      </Text>{' '}
      and{' '}
      <Text
        accessibilityRole="link"
        onPress={() => void openPrivacyPolicy()}
        className="font-body-semibold text-[12px] text-accent-700 underline"
        testID="privacy-link"
      >
        Privacy Policy
      </Text>
      .
    </Text>
  );
}
