import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React from 'react';

import { useCycles, useDailyLogs } from '@/api/cycles';
import { MonthGrid } from '@/components/calendar/month-grid';
import { AppHeader } from '@/components/ui/app-header';
import {
  FocusAwareStatusBar,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import {
  DEMO_CYCLES,
  DEMO_DAILY_LOGS,
  classifyDay,
  deriveCycleInsights,
  formatCalendarDate,
  todayDateString,
  withDemoFallback,
} from '@/lib/health';
import { usePaletteColors } from '@/lib/theme';

const TRACKING_ROUTE = '/(app)/tracking';
const FAB_ICON_SIZE = 18;
const FAB_CLEARANCE_CLASS = 'pb-28';

function shiftMonth(date: Date, deltaMonths: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + deltaMonths, 1);
}

function AddSymptomButton({ date }: { date: string }) {
  const router = useRouter();
  const palette = usePaletteColors();

  return (
    <Pressable
      accessibilityRole="button"
      testID="calendar-add-symptom"
      onPress={() => router.push({ pathname: TRACKING_ROUTE, params: { date } })}
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

/**
 * CalendarScreen: Master-Detail calendar displaying logged period cycles, estimated phases,
 * and a Day Summary card populated when tapping a date.
 */
export function CalendarScreen() {
  const [visibleMonth, setVisibleMonth] = React.useState(() => new Date());
  const [activeDate, setActiveDate] = React.useState(() => todayDateString());

  const { data: cyclesPage, isError: cyclesFailed } = useCycles();
  const { data: dailyLogsPage, isError: dailyLogsFailed } = useDailyLogs();

  const { rows: cycles } = withDemoFallback(
    { data: cyclesPage, isError: cyclesFailed },
    DEMO_CYCLES
  );
  const { rows: logs } = withDemoFallback(
    { data: dailyLogsPage, isError: dailyLogsFailed },
    DEMO_DAILY_LOGS
  );

  const cycleLengthDays = deriveCycleInsights(cycles)?.cycleLengthDays;

  const goToPrevMonth = () => setVisibleMonth((month) => shiftMonth(month, -1));
  const goToNextMonth = () => setVisibleMonth((month) => shiftMonth(month, 1));
  const goToMonth = (monthIndex: number) =>
    setVisibleMonth((month) => new Date(month.getFullYear(), monthIndex, 1));

  const classification = classifyDay(activeDate, {
    cycles,
    logs,
    today: todayDateString(),
    cycleLengthDays,
  });
  const activeLog = logs.find((l) => l.date === activeDate);

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
        {/* Strict 7-Column Grid Calendar */}
        <MonthGrid
          year={visibleMonth.getFullYear()}
          monthIndex={visibleMonth.getMonth()}
          cycles={cycles}
          logs={logs}
          cycleLengthDays={cycleLengthDays}
          selectedDate={activeDate}
          onSelectDate={setActiveDate}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onSelectMonth={goToMonth}
        />

        {/* Master-Detail: Day Summary Card */}
        <View className="mt-8">
          <Text className="mb-4 font-heading text-lg text-ink">
            {formatCalendarDate(activeDate)}
          </Text>
          <View
            className="rounded-3xl bg-white p-5"
            style={{
              shadowColor: '#F0E5E1',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.8,
              shadowRadius: 15,
              elevation: 3,
            }}
          >
            {activeLog ? (
              <View className="gap-3">
                <Text className="font-body-semibold text-[15px] text-ink">Logged Data</Text>
                {activeLog.flow && activeLog.flow !== 'none' && (
                  <Text className="font-body text-sm text-tone-600">
                    Flow: <Text className="font-body-semibold text-ink capitalize">{activeLog.flow}</Text>
                  </Text>
                )}
                {activeLog.mood && activeLog.mood !== 'unspecified' && (
                  <Text className="font-body text-sm text-tone-600">
                    Mood: <Text className="font-body-semibold text-ink capitalize">{activeLog.mood}</Text>
                  </Text>
                )}
                {activeLog.symptoms.length > 0 && (
                  <Text className="font-body text-sm text-tone-600">
                    Symptoms: <Text className="font-body-semibold text-ink">{activeLog.symptoms.length} logged</Text>
                  </Text>
                )}
                {(!activeLog.flow || activeLog.flow === 'none') &&
                  (!activeLog.mood || activeLog.mood === 'unspecified') &&
                  activeLog.symptoms.length === 0 && (
                    <Text className="font-body text-sm text-tone-500">Only basic info logged.</Text>
                  )}
              </View>
            ) : classification.isProjected || activeDate > todayDateString() ? (
              <View className="gap-2">
                <Text className="font-body-semibold text-[15px] text-ink">
                  {classification.phase === 'period'
                    ? 'Predicted Period'
                    : classification.phase === 'fertile'
                      ? 'Fertile Window'
                      : classification.phase === 'ovulation'
                        ? 'Predicted Ovulation Day'
                        : 'Future Date'}
                </Text>
                <Text className="font-body text-sm text-tone-500">
                  Log your symptoms as the date approaches to improve predictions.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                <Text className="font-body-semibold text-[15px] text-ink">No data logged</Text>
                <Text className="font-body text-sm text-tone-500">
                  Tap the + button to log symptoms for this day.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button passes activeDate */}
      <AddSymptomButton date={activeDate} />
    </View>
  );
}

export default CalendarScreen;
