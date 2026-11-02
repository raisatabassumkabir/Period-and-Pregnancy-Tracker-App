import React from 'react';
import { ActivityIndicator } from 'react-native';

import { usePartnerLinks } from '@/api/sharing';
import { InviteCard, JoinCard, LinkedCard } from '@/components/partner';
import {
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  View,
} from '@/components/ui';
import { AppHeader } from '@/components/ui/app-header';
import { translate } from '@/lib/i18n';
import { usePendingPartnerCode } from '@/lib/partner';
import { usePaletteColors } from '@/lib/theme';

/** Not linked: a pending invite code means "join"; otherwise she invites first. */
function NotLinked() {
  const pending = usePendingPartnerCode((state) => state.code);
  return pending ? (
    <View className="gap-4">
      <JoinCard />
      <InviteCard />
    </View>
  ) : (
    <View className="gap-4">
      <InviteCard />
      <JoinCard />
    </View>
  );
}

/**
 * The Partner tab, and where invite links land. Her side invites and
 * controls sharing; the partner's side joins and can unlink.
 */
export default function PartnerScreen() {
  const palette = usePaletteColors();
  const { data, isLoading } = usePartnerLinks();
  const hydrate = usePendingPartnerCode((state) => state.hydrate);
  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);
  const link = data?.[0] ?? null;

  return (
    <View className="flex-1 bg-canvas" testID="partner-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-2">
          <AppHeader title={translate('partner.settings_item')} />
        </View>
      </SafeAreaView>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pb-10 pt-4"
      >
        {isLoading ? <ActivityIndicator color={palette.accent} /> : null}
        {!isLoading && link ? <LinkedCard link={link} /> : null}
        {!isLoading && !link ? <NotLinked /> : null}
      </ScrollView>
    </View>
  );
}
