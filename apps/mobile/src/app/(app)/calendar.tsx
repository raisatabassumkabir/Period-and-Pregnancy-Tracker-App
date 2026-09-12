import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React from 'react';

import { useCycles, useDailyLogs } from '@/api/cycles';
import { MonthGrid } from '@/components/calendar';
import { AppHeader } from '@/components/ui/app-header';
import {
  FocusAwareStatusBar,
  Pill,
  Pressable,
  SafeAreaView,
  ScreenHeader,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import {
  DEMO_CYCLES,
  DEMO_DAILY_LOGS,
  deriveCycleInsights,
  withDemoFallback,
} from '@/lib/health';
import { usePaletteColors } from '@/lib/theme';

const TRACKING_ROUTE = '/(app)/tracking';
const FAB_ICON_SIZE = 18;
/** Room under the grid so the floating button never covers the last week. */
const FAB_CLEARANCE_CLASS = 'pb-28';

function shiftMonth(date: Date, deltaMonths: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + deltaMonths, 1);
}

function AddSymptomButton() {
  const router = useRouter();
  const palette = usePaletteColors();

  return (
    <Pressable
      accessibilityRole="button"
      testID="calendar-add-symptom"
      onPress={() => router.push(TRACKING_ROUTE)}
      className="absolute bottom-6 right-4 h-14 flex-row items-center gap-2 rounded-pill bg-accent px-6 active:opacity-90"
    >
      <Plus
        size={FAB_ICON_SIZE}
        color={palette.accentScale[100]}
        strokeWidth={3}
      />
      <Text className="font-body-bold text-[15px] text-accent-100">
        Add Symptom
      </Text>
    </Pressable>
  );
}

/** Month view of logged periods and estimated phases, with an offline demo fallback. */
export default function Calendar() {
  const [visibleMonth, setVisibleMonth] = React.useState(() => new Date());

  const { data: cyclesPage, isError: cyclesFailed } = useCycles();
  const { data: dailyLogsPage, isError: dailyLogsFailed } = useDailyLogs();

  const { rows: cycles, isDemo: cyclesAreDemo } = withDemoFallback(
    { data: cyclesPage, isError: cyclesFailed },
    DEMO_CYCLES
  );
  const { rows: logs, isDemo: logsAreDemo } = withDemoFallback(
    { data: dailyLogsPage, isError: dailyLogsFailed },
    DEMO_DAILY_LOGS
  );
  const isDemo = cyclesAreDemo || logsAreDemo;
  const cycleLengthDays = deriveCycleInsights(cycles)?.cycleLengthDays;

  const goToPrevMonth = () => setVisibleMonth((month) => shiftMonth(month, -1));
  const goToNextMonth = () => setVisibleMonth((month) => shiftMonth(month, 1));
  const goToMonth = (monthIndex: number) =>
    setVisibleMonth((month) => new Date(month.getFullYear(), monthIndex, 1));



  return (
    <View className="flex-1 bg-canvas" testID="calendar-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-2">
          <AppHeader title="Calendar" />
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName={`px-4 pt-4 ${FAB_CLEARANCE_CLASS}`}
      >
        <MonthGrid
          year={visibleMonth.getFullYear()}
          monthIndex={visibleMonth.getMonth()}
          cycles={cycles}
          logs={logs}
          cycleLengthDays={cycleLengthDays}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onSelectMonth={goToMonth}
        />
      </ScrollView>
      <AddSymptomButton />
    </View>
  );
}
