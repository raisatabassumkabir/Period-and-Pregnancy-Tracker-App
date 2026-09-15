import { useRouter } from 'expo-router';
import { ArrowRight, Baby, Calendar, HeartPulse, Plus, Sparkles } from 'lucide-react-native';
import React from 'react';

import { useCycles } from '@/api/cycles';
import { usePregnancies } from '@/api/pregnancy';
import {
  CycleRing,
  CycleStatusCards,
  DashboardSkeleton,
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

/** Normalizes and checks for cycle/period tracking intent from goals. */
export function hasPeriodGoal(goals: readonly string[] = []): boolean {
  return goals.some((g) => {
    const val = g.toLowerCase().trim();
    return (
      val === 'track my period' ||
      val === 'track_period' ||
      val === 'get pregnant' ||
      val === 'get_pregnant'
    );
  });
}

/** Normalizes and checks for pregnancy tracking intent from goals. */
export function hasPregnancyGoal(goals: readonly string[] = []): boolean {
  return goals.some((g) => {
    const val = g.toLowerCase().trim();
    return val === 'track my pregnancy' || val === 'track_pregnancy';
  });
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

function SectionHeading({
  title,
  isDemo,
}: {
  title: string;
  isDemo: boolean;
}) {
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

function CycleEmptyCard({ onStartCycle }: { onStartCycle: () => void }) {
  return (
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
            Start your first cycle
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
        onPress={onStartCycle}
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
          Start your first cycle
        </Text>
      </Pressable>
    </View>
  );
}

function PregnancyEmptyCard({
  onStartPregnancy,
}: {
  onStartPregnancy: () => void;
}) {
  return (
    <View
      className="mt-3 rounded-[24px] bg-white p-6"
      style={{
        shadowColor: '#F0E5E1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 3,
      }}
      testID="pregnancy-empty-state-card"
    >
      <View className="flex-row items-center gap-3">
        <View className="size-12 items-center justify-center rounded-full bg-[#E5F0FF]">
          <HeartPulse size={24} color="#5B9BD5" strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-base text-[#4A4A4A]">
            Start Pregnancy Tracking
          </Text>
          <Text className="font-body text-xs text-[#8C8C8C]">
            Personalized week-by-week timeline
          </Text>
        </View>
      </View>

      <Text className="font-body mt-4 text-[14px] leading-5 text-[#8C8C8C]">
        Follow your baby's development, track trimesters, and log important milestones week by week.
      </Text>

      <Pressable
        accessibilityRole="button"
        testID="start-pregnancy-cta"
        onPress={onStartPregnancy}
        className="mt-5 h-14 flex-row items-center justify-center gap-2 rounded-pill bg-[#B5D3F8] px-8 active:opacity-90"
      >
        <Plus size={ACTION_ICON_SIZE} color="#2A5C9A" strokeWidth={3} />
        <Text className="font-body-bold text-[16px] text-[#2A5C9A]">
          Start Pregnancy Tracking
        </Text>
      </Pressable>
    </View>
  );
}

/** Gestation ring + trimester/due-date tiles, or an invitation to start one. */
function PregnancySection({ leads }: { leads: boolean }) {
  const router = useRouter();
  const { data, isError, isLoading } = usePregnancies();

  if (isLoading) {
    return (
      <>
        <SectionHeading title="Pregnancy" isDemo={false} />
        <View className="mt-2">
          <DashboardSkeleton />
        </View>
      </>
    );
  }

  const { rows, isDemo } = withDemoFallback({ data, isError }, [
    DEMO_PREGNANCY,
  ]);
  const pregnancy = rows.find((item) => item.status === 'active');
  const progress = derivePregnancyProgress(pregnancy);

  if (!pregnancy || !progress) {
    return (
      <>
        <SectionHeading title="Pregnancy" isDemo={isDemo} />
        <PregnancyEmptyCard
          onStartPregnancy={() => router.push(TRACKING_ROUTE)}
        />
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
  const { data, isError, isLoading } = useCycles();
  const [isInitModalVisible, setIsInitModalVisible] = React.useState(false);

  if (isLoading) {
    return (
      <>
        <SectionHeading title="Cycle" isDemo={false} />
        <View className="mt-2">
          <DashboardSkeleton />
        </View>
      </>
    );
  }

  const { rows, isDemo } = withDemoFallback({ data, isError }, DEMO_CYCLES);
  const insights = deriveCycleInsights(rows);

  if (!insights) {
    return (
      <>
        <SectionHeading title="Cycle" isDemo={isDemo} />
        <CycleEmptyCard onStartCycle={() => setIsInitModalVisible(true)} />
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

interface PregnantTransitionBannerProps {
  onSwitchToPregnancy: () => void;
}

function PregnantTransitionBanner({
  onSwitchToPregnancy,
}: PregnantTransitionBannerProps) {
  return (
    <View
      testID="pregnant-transition-banner"
      className="mt-8 rounded-[24px] border border-[#DCEBFC] bg-[#F4F8FE] p-5"
      style={{
        shadowColor: '#5B9BD5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center gap-3.5">
        <View className="size-12 items-center justify-center rounded-full bg-[#DCEBFC]">
          <Baby size={24} color="#5B9BD5" strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-[16px] text-[#2A5C9A]">
            Pregnant? Switch to Pregnancy Mode
          </Text>
          <Text className="font-body mt-0.5 text-xs text-[#6B8BAE]">
            Follow baby&apos;s growth week-by-week and count kicks
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        testID="switch-to-pregnancy-cta"
        onPress={onSwitchToPregnancy}
        className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-pill bg-[#5B9BD5] px-5 active:scale-[0.98]"
        style={{
          shadowColor: '#5B9BD5',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Sparkles size={16} color="#FFFFFF" strokeWidth={2.5} />
        <Text className="font-body-bold text-[14px] text-white">
          Switch to Pregnancy Mode
        </Text>
        <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

interface CycleTransitionBannerProps {
  onSwitchToCycle: () => void;
}

function CycleTransitionBanner({
  onSwitchToCycle,
}: CycleTransitionBannerProps) {
  return (
    <View
      testID="cycle-transition-banner"
      className="mt-8 rounded-[24px] border border-[#FFE3E6] bg-[#FFF5F6] p-5"
      style={{
        shadowColor: '#FF9FA8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center gap-3.5">
        <View className="size-12 items-center justify-center rounded-full bg-[#FFE3E6]">
          <Calendar size={24} color="#FF7575" strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-[16px] text-[#A63C4F]">
            Looking for Menstrual Tracking?
          </Text>
          <Text className="font-body mt-0.5 text-xs text-[#A06E76]">
            Track period forecasts, ovulation, and fertile windows
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        testID="switch-to-cycle-cta"
        onPress={onSwitchToCycle}
        className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-pill bg-[#FF9FA8] px-5 active:scale-[0.98]"
        style={{
          shadowColor: '#FF9FA8',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Calendar size={16} color="#FFFFFF" strokeWidth={2.5} />
        <Text className="font-body-bold text-[14px] text-white">
          Switch to Cycle Mode
        </Text>
        <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

export default function Home() {
  const [mode, setTrackingMode] = useTrackingMode();
  const { profile, updateProfile } = usePersonalizationProfile();
  const today = todayDateString();
  const [selectedDate, setSelectedDate] = React.useState(today);

  // Read goals array from profile
  const rawGoals = profile?.goals ?? [];

  const tracksPeriod = hasPeriodGoal(rawGoals);
  const tracksPregnancy =
    hasPregnancyGoal(rawGoals) ||
    mode === 'pregnancy' ||
    profile?.mode === 'pregnancy';

  // Strict state machine logic:
  // 1. If both are explicitly selected in Step 2: render both sections.
  // 2. If only Period was selected: render ONLY CycleSection (Pregnancy is completely suppressed).
  // 3. If only Pregnancy was selected: render ONLY PregnancySection (Cycle is completely suppressed).
  // 4. If neither was selected (initial unconfigured state): default to CycleSection only, NEVER both.
  const hasBothGoals = tracksPeriod && tracksPregnancy;
  const isDefaultCycle = !tracksPeriod && !tracksPregnancy;

  const showCycleBlock =
    hasBothGoals || (tracksPeriod && !tracksPregnancy) || isDefaultCycle;
  const showPregnancyBlock =
    hasBothGoals || (tracksPregnancy && !tracksPeriod);

  const pregnancyLeads = mode === 'pregnancy' && showPregnancyBlock;

  const handleSwitchToPregnancy = React.useCallback(async () => {
    const nonTrackingGoals = rawGoals.filter(
      (g) => !hasPeriodGoal([g]) && !hasPregnancyGoal([g])
    );
    await updateProfile({
      mode: 'pregnancy',
      goals: [...nonTrackingGoals, 'track_pregnancy'],
    });
    await setTrackingMode('pregnancy');
  }, [rawGoals, updateProfile, setTrackingMode]);

  const handleSwitchToCycle = React.useCallback(async () => {
    const nonTrackingGoals = rawGoals.filter(
      (g) => !hasPeriodGoal([g]) && !hasPregnancyGoal([g])
    );
    await updateProfile({
      mode: 'cycle_tracking',
      goals: [...nonTrackingGoals, 'track_period'],
    });
    await setTrackingMode('cycle_tracking');
  }, [rawGoals, updateProfile, setTrackingMode]);

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
          <View
            className={showPregnancyBlock && pregnancyLeads ? 'mt-8' : 'mt-7'}
          >
            {cycle}
          </View>
        )}

        {showPregnancyBlock && !pregnancyLeads && (
          <View className="mt-8">{pregnancy}</View>
        )}

        {showCycleBlock && !showPregnancyBlock && (
          <PregnantTransitionBanner
            onSwitchToPregnancy={handleSwitchToPregnancy}
          />
        )}

        {showPregnancyBlock && !showCycleBlock && (
          <CycleTransitionBanner onSwitchToCycle={handleSwitchToCycle} />
        )}
      </ScrollView>
    </View>
  );
}
