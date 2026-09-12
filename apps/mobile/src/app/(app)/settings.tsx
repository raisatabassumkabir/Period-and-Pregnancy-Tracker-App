import { useRouter } from 'expo-router';
import React from 'react';

import { SubscriptionCard } from '@/components/billing';
import {
  DeleteAccountItem,
  ItemsContainer,
  LanguageItem,
  LogoutButton,
  PaletteItem,
  PersonalizationItem,
  ProfileHeader,
  SettingsLinks,
  ThemeItem,
} from '@/components/settings';
import {
  FocusAwareStatusBar,
  SafeAreaView,
  ScreenHeader,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { translate } from '@/lib';

export default function Settings() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-canvas">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-3">
          <ScreenHeader
            title={translate('settings.title')}
            onBack={router.canGoBack() ? router.back : undefined}
          />
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pb-10"
      >
        <View className="mt-4">
          <ProfileHeader />
        </View>
        <SubscriptionCard />

        <ItemsContainer title="settings.profile_title">
          <PersonalizationItem />
        </ItemsContainer>

        <ItemsContainer title="settings.generale">
          <LanguageItem />
          <ThemeItem />
          <PaletteItem />
        </ItemsContainer>

        <SettingsLinks />

        <ItemsContainer title="settings.account">
          <DeleteAccountItem />
        </ItemsContainer>

        <LogoutButton />

        <Text className="mt-6 text-center text-[11px] text-tone-600">
          {translate('settings.footer')}
        </Text>
      </ScrollView>
    </View>
  );
}
