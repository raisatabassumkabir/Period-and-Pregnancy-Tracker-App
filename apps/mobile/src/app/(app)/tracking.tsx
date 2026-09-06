import { useRouter } from 'expo-router';
import React from 'react';
import { showMessage } from 'react-native-flash-message';

import {
  DischargeSelector,
  FlowSelector,
  KickCounter,
  MoodSelector,
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
  Text,
  View,
} from '@/components/ui';
import { formatCalendarDate, todayDateString } from '@/lib/health';
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
  const {
    draft,
    setFlow,
    setMood,
    setDischarge,
    toggleSymptom,
    save,
    isSaving,
    hasExistingLog,
    saveError,
  } = useTodayLog();

  const handleApply = async () => {
    try {
      await save();
      showMessage({ message: 'Today’s log saved', type: 'success' });
    } catch {
      // `saveError` renders the problem's `detail` in the banner.
    }
  };

  return (
    <View className="flex-1 bg-canvas" testID="tracking-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-3">
          {/* Reached from a tab (no history) or pushed from the calendar FAB. */}
          <ScreenHeader
            title="Symptom"
            onBack={router.canGoBack() ? router.back : undefined}
          />
          <Text className="text-[13px] text-tone-600">
            {formatCalendarDate(todayDateString())}
          </Text>
        </View>
      </SafeAreaView>

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

        <Section title="Movements">
          <KickCounter />
        </Section>
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
