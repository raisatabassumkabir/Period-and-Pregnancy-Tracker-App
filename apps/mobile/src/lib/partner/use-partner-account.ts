import { usePersonalizationProfile } from '@/lib/health/use-personalization-profile';

import { usePartnerSide } from './use-partner-nudges';

/**
 * True on a partner's phone: linked as a partner, or set up in onboarding with
 * "I have a partner code". Screens use it to switch to the partner look
 * (lilac instead of rose) and the partner's two tabs.
 */
export function usePartnerAccount(): boolean {
  const { isPartner } = usePartnerSide();
  const { profile } = usePersonalizationProfile();
  return isPartner || profile.appIntent === 'partner';
}
