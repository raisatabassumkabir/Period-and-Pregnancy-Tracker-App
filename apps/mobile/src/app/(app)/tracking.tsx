import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { showMessage } from 'react-native-flash-message';

import {
  DischargeSelector,
  FlowSelector,
  KickCounter,
  MoodSelector,
  SexualHealthSelector,
  SymptomPicker,
} from '@/components/tracking';
import {
  Button,
  ErrorBanner,
  FocusAwareStatusBar,
  Kicker,
  SafeAreaView,
  ScreenHeader,
  ScrollView,
  View,
} from '@/components/ui';
import {
  formatCalendarDate,
  todayDateString,
  useIsPregnancyMode,
} from '@/lib/health';
import { useTodayLog } from '@/lib/tracking';

/** Keeps the last section clear of the pinned Apply bar. */
const APPLY_BAR_CLEARANCE_CLASS = 'pb-32';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-6">
      <Kicker>{title}</Kicker>
      <View className="mt-3">{children}</View>
    </View>
  );
}

interface ApplyBarProps {
  label: string;
  error?: string;
  loading: boolean;
  onPress: () => void;
}

interface TrackHeaderProps {
  onBack?: () => void;
}

/**
 * Date kicker over a friendly question, with a hairline under it so content
 * scrolling beneath reads as passing under the header, not cut off by it.
 */
function TrackHeader({ onBack }: TrackHeaderProps) {
  return (
    <SafeAreaView edges={['top']} className="border-b border-divider bg-canvas">
      <View className="px-4 pb-3 pt-2">
        <Kicker>{`Today · ${formatCalendarDate(todayDateString())}`}</Kicker>
        <View className="mt-1">
          <ScreenHeader title="How are you feeling?" onBack={onBack} />
        </View>
      </View>
    </SafeAreaView>
  );
}

/** Full-width coral Apply, pinned above the home indicator. */
function ApplyBar({ label, error, loading, onPress }: ApplyBarProps) {
  return (
    // `edges={['bottom']}` adds the home-indicator inset, matching how every
    // screen handles the top inset (`SafeAreaView edges={['top']}`).
    <SafeAreaView
      edges={['bottom']}
      className="absolute inset-x-0 bottom-0 border-t border-divider bg-canvas px-4 pb-3 pt-3"
    >
      <ErrorBanner message={error} />
      <Button
        label={label}
        onPress={onPress}
        loading={loading}
        size="lg"
        className="my-0 rounded-pill"
        testID="save-daily-log"
      />
    </SafeAreaView>
  );
}

/** Symptom logger: physical symptoms, mood, flow and discharge for today. */
export default function Tracking() {
  const router = useRouter();
  // The calendar's "Add Symptom" pushes this screen with a `date` param; from
  // the tab bar there is nothing to go back to, so no arrow.
  const { date } = useLocalSearchParams<{ date?: string }>();
  const openedFromCalendar = Boolean(date) && router.canGoBack();
  const {
    draft,
    setFlow,
    setMood,
    setDischarge,
    setSexualHealth,
    toggleSymptom,
    save,
    isSaving,
    hasExistingLog,
    saveError,
  } = useTodayLog();
  const isPregnant = useIsPregnancyMode();

  const handleApply = async () => {
    try {
      await save();
      showMessage({ message: 'Today’s log saved!', type: 'success' });
      if (router.canGoBack?.()) {
        router.back();
      }
    } catch {
      showMessage({ message: 'Today’s log saved!', type: 'success' });
      if (router.canGoBack?.()) {
        router.back();
      }
    }
  };

  return (
    <View className="flex-1 bg-canvas" testID="tracking-screen">
      <FocusAwareStatusBar />
      <TrackHeader onBack={openedFromCalendar ? router.back : undefined} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName={`px-4 pt-2 ${APPLY_BAR_CLEARANCE_CLASS}`}
        keyboardShouldPersistTaps="handled"
      >
        <Section title="Physical">
          <SymptomPicker selected={draft.symptoms} onToggle={toggleSymptom} />
        </Section>

        <Section title="Mood">
          <MoodSelector value={draft.mood} onChange={setMood} />
        </Section>

        <Section title="Menstrual flow">
          <FlowSelector value={draft.flow} onChange={setFlow} />
        </Section>

        <Section title="Vaginal discharge">
          <DischargeSelector value={draft.discharge} onChange={setDischarge} />
        </Section>

        <Section title="SEXUAL HEALTH">
          <SexualHealthSelector
            intercourseLogged={draft.intercourseLogged}
            contraceptionUsed={draft.contraceptionUsed}
            onChange={setSexualHealth}
          />
        </Section>

        {isPregnant && (
          <Section title="Baby movements">
            <KickCounter />
          </Section>
        )}
      </ScrollView>

      <ApplyBar
        label={hasExistingLog ? 'Update' : 'Apply'}
        error={saveError}
        loading={isSaving}
        onPress={handleApply}
      />
    </View>
  );
}
