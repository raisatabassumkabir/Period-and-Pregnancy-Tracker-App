import { useRouter } from 'expo-router';
import { Baby, Calendar, HeartPulse, Plus } from 'lucide-react-native';
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
import { PromptCard } from '@/components/dashboard/prompt-card';
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
  useDemoSeedAllowed,
  usePersonalizationProfile,
  useTrackingMode,
  withDemoFallback,
} from '@/lib/health';

const ACTION_ICON_SIZE = 18;
/** Accent fills are mid-tone in every palette and mode, so white reads on all of them. */
const ON_ACCENT_COLOR = '#FFFFFF';
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
  return (
    <Pressable
      accessibilityRole="button"
      testID="dashboard-log-action"
      onPress={() => router.push(TRACKING_ROUTE)}
      className="mt-5 h-14 flex-row items-center justify-center gap-2 self-center rounded-pill bg-accent px-8 active:opacity-90"
    >
      <Plus size={ACTION_ICON_SIZE} color={ON_ACCENT_COLOR} strokeWidth={3} />
      <Text className="font-body-bold text-[16px] text-white">{label}</Text>
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

function CycleEmptyCard({ onStartCycle }: { onStartCycle: () => void }) {
  return (
    <View className="mt-3">
      <PromptCard
        icon={Calendar}
        title="Start your first cycle"
        subtitle="Get fertile window and period forecasts"
        body="Log your first period to see your current cycle day, predicted ovulation, and next expected period date."
        cta={{
          label: 'Start your first cycle',
          onPress: onStartCycle,
          testID: 'start-first-log-cta',
        }}
        testID="cycle-empty-state-card"
      />
    </View>
  );
}

function PregnancyEmptyCard({
  onStartPregnancy,
}: {
  onStartPregnancy: () => void;
}) {
  return (
    <View className="mt-3">
      <PromptCard
        icon={HeartPulse}
        tone="accent2"
        title="Start Pregnancy Tracking"
        subtitle="Personalized week-by-week timeline"
        body="Follow your baby's development, track trimesters, and log important milestones week by week."
        cta={{
          label: 'Start Pregnancy Tracking',
          onPress: onStartPregnancy,
          testID: 'start-pregnancy-cta',
        }}
        testID="pregnancy-empty-state-card"
      />
    </View>
  );
}

/** Gestation ring + trimester/due-date tiles, or an invitation to start one. */
function PregnancySection({ leads }: { leads: boolean }) {
  const router = useRouter();
  const { data, isError, isLoading } = usePregnancies();
  const allowSeed = useDemoSeedAllowed();

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

  const { rows, isDemo } = withDemoFallback(
    { data, isError },
    [DEMO_PREGNANCY],
    allowSeed
  );
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

/**
 * A user with no cycle history is asked for her last period start straight
 * away; predictions are meaningless without that anchor. Prompts once per
 * mount so dismissing it is respected — the empty-state CTA reopens it.
 */
function useFirstCyclePrompt(needsFirstCycle: boolean) {
  const [isVisible, setIsVisible] = React.useState(false);
  const hasPrompted = React.useRef(false);

  React.useEffect(() => {
    if (!needsFirstCycle || hasPrompted.current) return;
    hasPrompted.current = true;
    setIsVisible(true);
  }, [needsFirstCycle]);

  const open = React.useCallback(() => setIsVisible(true), []);
  const close = React.useCallback(() => setIsVisible(false), []);
  return { isVisible, open, close };
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
  const allowSeed = useDemoSeedAllowed();
  const { rows, isDemo } = withDemoFallback(
    { data, isError },
    DEMO_CYCLES,
    allowSeed
  );
  const insights = deriveCycleInsights(rows);
  const firstCyclePrompt = useFirstCyclePrompt(!isLoading && !insights);

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

  if (!insights) {
    return (
      <>
        <SectionHeading title="Cycle" isDemo={isDemo} />
        <CycleEmptyCard onStartCycle={firstCyclePrompt.open} />
        <InitializeCycleModal
          visible={firstCyclePrompt.isVisible}
          onClose={firstCyclePrompt.close}
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
        <View className="mt-5">
          <PromptCard
            icon={HeartPulse}
            title={medicalInsight.title}
            subtitle="Educational health notice"
            body={medicalInsight.message}
            testID="pcos-medical-insight-card"
          />
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

function PregnantTransitionBanner({
  onSwitchToPregnancy,
}: {
  onSwitchToPregnancy: () => void;
}) {
  return (
    <View className="mt-8">
      <PromptCard
        icon={Baby}
        tone="accent2"
        title="Pregnant? Switch to Pregnancy Mode"
        subtitle="Follow baby's growth week-by-week and count kicks"
        cta={{
          label: 'Switch to Pregnancy Mode',
          onPress: onSwitchToPregnancy,
          testID: 'switch-to-pregnancy-cta',
        }}
        testID="pregnant-transition-banner"
      />
    </View>
  );
}

function CycleTransitionBanner({
  onSwitchToCycle,
}: {
  onSwitchToCycle: () => void;
}) {
  return (
    <View className="mt-8">
      <PromptCard
        icon={Calendar}
        title="Looking for Menstrual Tracking?"
        subtitle="Track period forecasts, ovulation, and fertile windows"
        cta={{
          label: 'Switch to Cycle Mode',
          onPress: onSwitchToCycle,
          testID: 'switch-to-cycle-cta',
        }}
        testID="cycle-transition-banner"
      />
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
  const showPregnancyBlock = hasBothGoals || (tracksPregnancy && !tracksPeriod);

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
