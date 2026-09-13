import { useRouter } from 'expo-router';
import { Calendar, HeartPulse, Plus } from 'lucide-react-native';
import React from 'react';

import { useCycles } from '@/api/cycles';
import { usePregnancies } from '@/api/pregnancy';
import {
  CycleRing,
  CycleStatusCards,
  PregnancyRing,
  PregnancyStatusCards,
  WeekStrip,
} from '@/components/dashboard';
import { InitializeCycleModal } from '@/components/dashboard/initialize-cycle-modal';
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
import { AppHeader } from '@/components/ui/app-header';
import {
  DEMO_CYCLES,
  DEMO_PREGNANCY,
  deriveCycleInsights,
  derivePcosMedicalInsight,
  derivePregnancyProgress,
  pregnancyChanceFor,
  resolveCycleDay,
  todayDateString,
  usePersonalizationProfile,
  useTrackingMode,
  withDemoFallback,
} from '@/lib/health';
import { usePaletteColors } from '@/lib/theme';

const ACTION_ICON_SIZE = 18;
const TRACKING_ROUTE = '/(app)/tracking';

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
  const router = useRouter();
  const palette = usePaletteColors();
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
        <View
          className="mt-3 rounded-[24px] bg-white p-5"
          style={{
            shadowColor: '#F0E5E1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.8,
            shadowRadius: 15,
            elevation: 3,
          }}
        >
          <Text className="font-heading text-base text-[#4A4A4A]">
            No active pregnancy. Start one to follow your week-by-week timeline.
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="start-pregnancy-cta"
            onPress={() => router.push(TRACKING_ROUTE)}
            className="mt-4 h-14 flex-row items-center justify-center gap-2 rounded-pill bg-[#B5D3F8] px-8 active:opacity-90"
          >
            <Plus size={ACTION_ICON_SIZE} color="#2A5C9A" strokeWidth={3} />
            <Text className="font-body-bold text-[16px] text-[#2A5C9A]">
              Start Pregnancy Tracking
            </Text>
          </Pressable>
        </View>
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
  medicalConditions: readonly string[];
  averageCycleLength: number;
}

/** Cycle-day ring + next period and conception-chance tiles. */
function CycleSection({
  leads,
  today,
  selectedDate,
  medicalConditions,
  averageCycleLength,
}: CycleSectionProps) {
  const router = useRouter();
  const palette = usePaletteColors();
  const { data, isError } = useCycles();
  const { rows, isDemo } = withDemoFallback({ data, isError }, DEMO_CYCLES);
  const insights = deriveCycleInsights(rows);
  const [isInitModalVisible, setIsInitModalVisible] = React.useState(false);

  if (!insights) {
    return (
      <>
        <SectionHeading title="Cycle" isDemo={isDemo} />
        {/* Inviting pastel card with prominent CTA */}
        <View
          className="mt-3 rounded-[24px] bg-white p-6"
          style={{
            shadowColor: '#F0E5E1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.8,
            shadowRadius: 15,
            elevation: 3,
          }}
          testID="cycle-empty-state-card"
        >
          <View className="flex-row items-center gap-3">
            <View className="size-12 items-center justify-center rounded-full bg-[#FFE5E8]">
              <Calendar size={24} color="#FF9FA8" strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-base text-[#4A4A4A]">
                Track your menstrual cycle
              </Text>
              <Text className="font-body text-xs text-[#8C8C8C]">
                Get fertile window and period forecasts
              </Text>
            </View>
          </View>

          <Text className="font-body mt-4 text-[14px] leading-5 text-[#8C8C8C]">
            Log your first period to see your current cycle day, predicted ovulation, and next expected period date.
          </Text>

          <Pressable
            accessibilityRole="button"
            testID="start-first-log-cta"
            onPress={() => setIsInitModalVisible(true)}
            className="mt-5 h-14 flex-row items-center justify-center gap-2 rounded-pill bg-[#FF9FA8] px-8 active:scale-[0.98]"
            style={{
              shadowColor: '#FF9FA8',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={3} />
            <Text className="font-body-bold text-[16px] text-white">
              Start my first log
            </Text>
          </Pressable>
        </View>

        <InitializeCycleModal
          visible={isInitModalVisible}
          onClose={() => setIsInitModalVisible(false)}
        />
      </>
    );
  }

  const context = { cycles: rows, cycleLengthDays: insights.cycleLengthDays };
  const todayInCycle = resolveCycleDay(today, context);
  const selectedInCycle = resolveCycleDay(selectedDate, context);
  const chance = pregnancyChanceFor(selectedInCycle, insights.cycleLengthDays);

  // Derive conditional medical insight for PCOS / Endometriosis
  const medicalInsight = derivePcosMedicalInsight({
    medicalConditions,
    currentCycleDay: insights.currentDay,
    baselineCycleLength: averageCycleLength || insights.cycleLengthDays,
  });

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

      {/* Conditional PCOS / Endometriosis Late Period Card */}
      {medicalInsight.shouldShowLatePeriodCard && (
        <View
          testID="pcos-medical-insight-card"
          className="mt-5 rounded-[24px] border border-[#FF9FA8]/30 bg-white p-5"
          style={{
            shadowColor: '#F0E5E1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.8,
            shadowRadius: 15,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-full bg-[#FFE5E8]">
              <HeartPulse size={20} color="#FF9FA8" strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-sm text-[#4A4A4A]">
                {medicalInsight.title}
              </Text>
              <Text className="font-body text-xs text-[#8C8C8C]">
                Personalized medical guidance
              </Text>
            </View>
          </View>
          <Text className="font-body mt-3 text-[13px] leading-5 text-[#4A4A4A]">
            {medicalInsight.message}
          </Text>
        </View>
      )}

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
  const { profile } = usePersonalizationProfile();
  const today = todayDateString();
  const [selectedDate, setSelectedDate] = React.useState(today);

  // Dynamic dashboard state derived from onboarding goals
  const userGoals = profile?.goals ?? [];
  const tracksPregnancyGoal = userGoals.includes('track_pregnancy');
  const tracksPeriodGoal =
    userGoals.includes('track_period') || userGoals.includes('get_pregnant');

  // Strict goal check: If a user selected "Track my period" and DID NOT select "Track my pregnancy", completely hide the Pregnancy UI block.
  const shouldHidePregnancy = tracksPeriodGoal && !tracksPregnancyGoal;
  const showPregnancyBlock = !shouldHidePregnancy;

  // If a user selected "Track my pregnancy" and DID NOT select "Track my period", hide the cycle block.
  const shouldHideCycle = tracksPregnancyGoal && !tracksPeriodGoal;
  const showCycleBlock = !shouldHideCycle;

  const pregnancyLeads = mode === 'pregnancy' && showPregnancyBlock;

  const cycle = (
    <CycleSection
      leads={!pregnancyLeads}
      today={today}
      selectedDate={selectedDate}
      medicalConditions={profile?.medicalConditions ?? []}
      averageCycleLength={profile?.averageCycleLength ?? 28}
    />
  );
  const pregnancy = <PregnancySection leads={pregnancyLeads} />;

  return (
    <View className="flex-1 bg-canvas" testID="home-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-2">
          <AppHeader />
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

        {showPregnancyBlock && pregnancyLeads && (
          <View className="mt-7">{pregnancy}</View>
        )}

        {showCycleBlock && (
          <View className={showPregnancyBlock && pregnancyLeads ? 'mt-8' : 'mt-7'}>
            {cycle}
          </View>
        )}

        {showPregnancyBlock && !pregnancyLeads && (
          <View className="mt-8">{pregnancy}</View>
        )}
      </ScrollView>
    </View>
  );
}
