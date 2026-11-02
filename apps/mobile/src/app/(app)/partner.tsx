import React from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';

import { useOpenInvite, usePartnerLinks } from '@/api/sharing';
import {
  InviteCard,
  JoinCard,
  LinkedCard,
  OfflineAccountCard,
} from '@/components/partner';
import {
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  View,
} from '@/components/ui';
import { AppHeader } from '@/components/ui/app-header';
import { useAuth } from '@/lib/auth';
import { isDemoToken } from '@/lib/auth/demo-users';
import { translate } from '@/lib/i18n';
import { usePendingPartnerCode } from '@/lib/partner';
import { usePaletteColors } from '@/lib/theme';

/** While her code waits to be used, check this often so the screen flips to "linked". */
const WAITING_POLL_MS = 5_000;

/**
 * Not linked. Someone who arrived through her link (a pending code) sees
 * "join" first; otherwise she sees her invite first.
 */
function NotLinked() {
  const pending = usePendingPartnerCode((state) => state.code);
  const cards = [<InviteCard key="invite" />, <JoinCard key="join" />];
  return <View className="gap-4">{pending ? cards.reverse() : cards}</View>;
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
  const token = useAuth.use.token();
  const hydrate = usePendingPartnerCode((state) => state.hydrate);
  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);
  const offline = isDemoToken(token?.access);

  return (
    <View className="flex-1 bg-canvas" testID="partner-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-2">
          <AppHeader title={translate('partner.settings_item')} />
        </View>
      </SafeAreaView>
      {offline ? (
        <View className="px-4 pt-4">
          <OfflineAccountCard />
        </View>
      ) : (
        <PartnerContent />
      )}
    </View>
  );
}
