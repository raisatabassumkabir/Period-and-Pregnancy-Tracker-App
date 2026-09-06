import { useRouter } from 'expo-router';
import { Bell, Plus, User } from 'lucide-react-native';
import React from 'react';

import { useMe } from '@/api/auth';
import { usePaymentSubscriptionStatus } from '@/api/billing/use-subscription-status';
import { useCycles } from '@/api/cycles';
import { usePregnancies } from '@/api/pregnancy';
import { PremiumBadge } from '@/components/billing';
import {
  CycleRing,
  CycleStatusCards,
  PregnancyRing,
  PregnancyStatusCards,
  WeekStrip,
} from '@/components/dashboard';
import {
  FocusAwareStatusBar,
  Kicker,
  Pill,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import {
  DEMO_CYCLES,
  DEMO_PREGNANCY,
  deriveCycleInsights,
  derivePregnancyProgress,
  pregnancyChanceFor,
  resolveCycleDay,
  todayDateString,
  useTrackingMode,
  withDemoFallback,
} from '@/lib/health';
import { usePaletteColors } from '@/lib/theme';

const AVATAR_ICON_SIZE = 20;
const BELL_ICON_SIZE = 22;
const ACTION_ICON_SIZE = 18;
const SETTINGS_ROUTE = '/(app)/settings';
const TRACKING_ROUTE = '/(app)/tracking';

function AvatarButton({ fullName }: { fullName: string | null | undefined }) {
  const router = useRouter();
  const palette = usePaletteColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      testID="settings-avatar"
      onPress={() => router.push(SETTINGS_ROUTE)}
      className="size-[46px] items-center justify-center rounded-full bg-accent-200"
    >
      {fullName ? (
        <Text className="font-body-bold text-lg text-accent-800">
          {fullName.charAt(0).toUpperCase()}
        </Text>
      ) : (
        <User size={AVATAR_ICON_SIZE} color={palette.accentScale[800]} />
      )}
    </Pressable>
  );
}

function TopBar() {
  const { data: user } = useMe();
  const { data: subscription } = usePaymentSubscriptionStatus({
    refetchOnWindowFocus: true,
  });
  const palette = usePaletteColors();

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const isPremium = subscription?.is_premium ?? false;

  return (
    <View className="flex-row items-center gap-3">
      <AvatarButton fullName={user?.full_name} />
      <View className="flex-1">
        <Text className="font-body-semibold text-[13px] text-tone-600">
          Welcome back!
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="font-heading text-[22px] text-ink">Hello,</Text>
          <Text className="font-heading text-[22px] text-ink">{firstName}</Text>
          {isPremium && <PremiumBadge compact />}
        </View>
      </View>
      <View
        className="size-[46px] items-center justify-center rounded-full bg-surface"
        testID="notifications-bell"
        accessibilityLabel="Notifications"
      >
        <Bell size={BELL_ICON_SIZE} color={palette.ink} />
      </View>
    </View>
  );
}

function LogActionButton({ label }: { label: string }) {
  const router = useRouter();
  const palette = usePaletteColors();

  return (
    <Pressable
      accessibilityRole="button"
      testID="dashboard-log-action"
      onPress={() => router.push(TRACKING_ROUTE)}
      className="mt-5 h-14 flex-row items-center justify-center gap-2 self-center rounded-pill bg-accent px-8 active:opacity-90"
    >
      <Plus
        size={ACTION_ICON_SIZE}
        color={palette.accentScale[100]}
        strokeWidth={3}
      />
      <Text className="font-body-bold text-[16px] text-accent-100">
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View className="mt-2 rounded-card bg-surface/80 p-5">
      <Text className="text-[15px] leading-6 text-tone-700">{message}</Text>
    </View>
  );
}

function SectionHeading({ title, isDemo }: { title: string; isDemo: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Kicker>{title}</Kicker>
      {isDemo && (
        <Pill
          label="Demo data"
          tone="accent2-soft"
          badge
          testID={`${title.toLowerCase()}-demo-pill`}
        />
      )}
    </View>
  );
}

/** Gestation ring + trimester/due-date tiles, or an invitation to start one. */
function PregnancySection({ leads }: { leads: boolean }) {
  const { data, isError } = usePregnancies();
  const { rows, isDemo } = withDemoFallback({ data, isError }, [
    DEMO_PREGNANCY,
  ]);
  const pregnancy = rows.find((item) => item.status === 'active');
  const progress = derivePregnancyProgress(pregnancy);

  if (!pregnancy || !progress) {
    return (
      <>
        <SectionHeading title="Pregnancy" isDemo={isDemo} />
        <EmptyState message="No active pregnancy. Start one to follow your week-by-week timeline." />
      </>
    );
  }

  return (
    <>
      <SectionHeading title="Pregnancy" isDemo={isDemo} />
      <View className="mt-4">
        <PregnancyRing progress={progress} testID="pregnancy-ring" />
      </View>
      {leads && <LogActionButton label="Log Kick" />}
      <View className="mt-5">
        <PregnancyStatusCards pregnancy={pregnancy} progress={progress} />
      </View>
    </>
  );
}

interface CycleSectionProps {
  leads: boolean;
  today: string;
  selectedDate: string;
}

/** Cycle-day ring + next period and conception-chance tiles. */
function CycleSection({ leads, today, selectedDate }: CycleSectionProps) {
  const { data, isError } = useCycles();
  const { rows, isDemo } = withDemoFallback({ data, isError }, DEMO_CYCLES);
  const insights = deriveCycleInsights(rows);

  if (!insights) {
    return (
      <>
        <SectionHeading title="Cycle" isDemo={isDemo} />
        <EmptyState message="Log your first period to see your cycle day and next expected date." />
      </>
    );
  }

  const context = { cycles: rows, cycleLengthDays: insights.cycleLengthDays };
  const todayInCycle = resolveCycleDay(today, context);
  const selectedInCycle = resolveCycleDay(selectedDate, context);
  const chance = pregnancyChanceFor(selectedInCycle, insights.cycleLengthDays);

  return (
    <>
      <SectionHeading title="Cycle" isDemo={isDemo} />
      <View className="mt-4">
        <CycleRing
          insights={insights}
          today={todayInCycle}
          testID="cycle-ring"
        />
      </View>
      {leads && <LogActionButton label="Log Period" />}
      <View className="mt-5">
        <CycleStatusCards
          insights={insights}
          chance={chance}
          chanceDate={selectedDate}
          today={today}
        />
      </View>
    </>
  );
}

export default function Home() {
  const [mode] = useTrackingMode();
  const today = todayDateString();
  const [selectedDate, setSelectedDate] = React.useState(today);
  const pregnancyLeads = mode === 'pregnancy';

  const cycle = (
    <CycleSection
      leads={!pregnancyLeads}
      today={today}
      selectedDate={selectedDate}
    />
  );
  const pregnancy = <PregnancySection leads={pregnancyLeads} />;

  return (
    <View className="flex-1 bg-canvas" testID="home-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-3">
          <TopBar />
        </View>
      </SafeAreaView>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pb-8 pt-5"
      >
        <WeekStrip
          today={today}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
        <View className="mt-7">{pregnancyLeads ? pregnancy : cycle}</View>
        <View className="mt-8">{pregnancyLeads ? cycle : pregnancy}</View>
      </ScrollView>
    </View>
  );
}
