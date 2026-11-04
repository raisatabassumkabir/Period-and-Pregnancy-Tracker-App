import React from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';

import { useOpenInvite, usePartnerLinks } from '@/api/sharing';
import { InviteCard, JoinCard, LinkedCard } from '@/components/partner';
import {
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  View,
} from '@/components/ui';
import { AppHeader } from '@/components/ui/app-header';
import { usePersonalizationProfile } from '@/lib/health';
import { translate } from '@/lib/i18n';
import { usePartnerAccount, usePendingPartnerCode } from '@/lib/partner';
import { usePaletteColors } from '@/lib/theme';

/** While her code waits to be used, check this often so the screen flips to "linked". */
const WAITING_POLL_MS = 5_000;

/**
 * Not linked. Onboarding already asked who this phone is for, so there is no
 * second choice here: she ("for myself") gets only her code to share; a
 * partner ("I have a partner code"), or anyone who opened an invite link,
 * gets only the code entry. Waits for the saved answer first, so a partner
 * never sees (or auto-creates) a code of their own while it loads.
 */
function NotLinked() {
  const palette = usePaletteColors();
  const pending = usePendingPartnerCode((state) => state.code);
  const pendingReady = usePendingPartnerCode((state) => state.hydrated);
  const { profile, isLoading } = usePersonalizationProfile();
  if (isLoading || !pendingReady) {
    return <ActivityIndicator color={palette.accent} />;
  }
  const isPartnerAccount = !!pending || profile.appIntent === 'partner';
  return isPartnerAccount ? <JoinCard /> : <InviteCard />;
}

function usePartnerScreenData() {
  const { invite, refetch: refetchInvite } = useOpenInvite();
  const links = usePartnerLinks({
    refetchInterval: invite ? WAITING_POLL_MS : false,
  });
  const [refreshing, setRefreshing] = React.useState(false);
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([links.refetch(), refetchInvite()]);
    setRefreshing(false);
  };
  return {
    link: links.data?.[0] ?? null,
    isLoading: links.isLoading,
    refreshing,
    refresh,
  };
}

function PartnerContent() {
  const palette = usePaletteColors();
  const { link, isLoading, refreshing, refresh } = usePartnerScreenData();
  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-4 pb-10 pt-4"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          colors={[palette.accent]}
        />
      }
    >
      {isLoading ? <ActivityIndicator color={palette.accent} /> : null}
      {!isLoading && link ? <LinkedCard link={link} /> : null}
      {!isLoading && !link ? <NotLinked /> : null}
    </ScrollView>
  );
}

/**
 * The Partner tab, and where invite links land. Her side shares her link
 * and controls sharing; the partner's side pastes the link (or code) and joins.
 */
export default function PartnerScreen() {
  const partnerAccount = usePartnerAccount();
  const hydrate = usePendingPartnerCode((state) => state.hydrate);
  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <View
      className={`flex-1 ${partnerAccount ? 'bg-accent2-100/50' : 'bg-canvas'}`}
      testID="partner-screen"
    >
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-2">
          <AppHeader title={translate('partner.settings_item')} />
        </View>
      </SafeAreaView>
      <PartnerContent />
    </View>
  );
}
