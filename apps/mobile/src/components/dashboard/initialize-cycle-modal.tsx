import { useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useInitCycle } from '@/api/cycles';
import {
  addDays,
  buildMonthMatrix,
  formatCalendarDate,
  parseDateString,
  toDateString,
  todayDateString,
} from '@/lib/health';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export interface InitializeCycleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InitializeCycleModal({
  visible,
  onClose,
  onSuccess,
}: InitializeCycleModalProps) {
  const queryClient = useQueryClient();
  const initCycle = useInitCycle();

  const today = React.useMemo(() => todayDateString(), []);
  const [selectedDate, setSelectedDate] = React.useState<string>(today);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => new Date());
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Sync state when modal is opened
  React.useEffect(() => {
    if (visible) {
      setSelectedDate(todayDateString());
      setCurrentMonth(new Date());
      setErrorMessage(null);
    }
  }, [visible]);

  const year = currentMonth.getFullYear();
  const monthIndex = currentMonth.getMonth();
  const monthWeeks = React.useMemo(
    () => buildMonthMatrix(year, monthIndex),
    [year, monthIndex]
  );

  const monthTitle = React.useMemo(
    () =>
      currentMonth.toLocaleDateString('en', {
        month: 'long',
        year: 'numeric',
      }),
    [currentMonth]
  );

  const isCurrentMonthOrFuture = React.useMemo(() => {
    const now = new Date();
    return (
      year > now.getFullYear() ||
      (year === now.getFullYear() && monthIndex >= now.getMonth())
    );
  }, [year, monthIndex]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, monthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    if (!isCurrentMonthOrFuture) {
      setCurrentMonth(new Date(year, monthIndex + 1, 1));
    }
  };

  const quickOptions = React.useMemo(() => {
    const now = new Date();
    return [
      { label: 'Today', date: today },
      { label: 'Yesterday', date: toDateString(addDays(now, -1)) },
      { label: '3 days ago', date: toDateString(addDays(now, -3)) },
      { label: '1 week ago', date: toDateString(addDays(now, -7)) },
    ];
  }, [today]);

  const handleQuickSelect = (date: string) => {
    setSelectedDate(date);
    const parsed = parseDateString(date);
    if (parsed) {
      setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  };

  const handleDismiss = React.useCallback(() => {
    if (initCycle.isPending) return;
    setErrorMessage(null);
    onClose();
  }, [initCycle.isPending, onClose]);

  const handleConfirm = async () => {
    if (initCycle.isPending) return;
    setErrorMessage(null);
    try {
      await initCycle.mutateAsync({ start_date: selectedDate });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cycles'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'current-cycle'] }),
        queryClient.invalidateQueries({ queryKey: ['daily-logs'] }),
      ]);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorBody = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data;
      setErrorMessage(
        errorBody?.detail || 'Failed to initialize cycle. Please try again.'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
      testID="initialize-cycle-modal"
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="absolute inset-0" onPress={handleDismiss} />
        <View
          className="max-h-[90%] rounded-t-[28px] bg-white p-6"
          style={{
            shadowColor: '#F0E5E1',
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.9,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-full bg-[#FFE5E8]">
                <Calendar size={20} color="#FF9FA8" strokeWidth={2.5} />
              </View>
              <Text className="font-heading text-lg text-[#2A2321]">
                Initialize Cycle
              </Text>
            </View>
            <Pressable
              onPress={handleDismiss}
              disabled={initCycle.isPending}
              hitSlop={8}
              testID="init-cycle-cancel-button"
              className={`p-1 ${initCycle.isPending ? 'opacity-40' : 'active:opacity-60'}`}
            >
              <X size={20} color="#A0A0B0" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
            <Text className="font-heading text-[17px] text-[#2A2321]">
              When did your last period start?
            </Text>
            <Text className="font-body mt-1 text-xs text-[#8C8C8C]">
              We need an anchor date to compute your cycle days, fertile window, and period predictions.
            </Text>

            {/* Quick Pick Chips */}
            <View className="mt-4 flex-row flex-wrap gap-2">
              {quickOptions.map((opt) => {
                const isSelected = selectedDate === opt.date;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => handleQuickSelect(opt.date)}
                    className={`rounded-full px-3.5 py-1.5 border ${
                      isSelected
                        ? 'border-[#FF9FA8] bg-[#FFE5E8]'
                        : 'border-[#F0E5E1] bg-white'
                    }`}
                    testID={`init-cycle-quick-${opt.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Text
                      className={`text-xs ${
                        isSelected
                          ? 'font-body-bold text-[#E06B78]'
                          : 'font-body text-[#6A6A6A]'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Calendar View */}
            <View className="mt-4 rounded-2xl border border-[#F0E5E1] bg-[#FCF8F5] p-3">
              {/* Month Navigation */}
              <View className="flex-row items-center justify-between pb-2">
                <Pressable
                  onPress={handlePrevMonth}
                  className="rounded-full p-2 active:bg-white"
                  testID="init-cycle-prev-month"
                >
                  <ChevronLeft size={18} color="#6A6A6A" />
                </Pressable>
                <Text className="font-heading text-sm text-[#2A2321]">
                  {monthTitle}
                </Text>
                <Pressable
                  onPress={handleNextMonth}
                  disabled={isCurrentMonthOrFuture}
                  className={`rounded-full p-2 ${
                    isCurrentMonthOrFuture ? 'opacity-30' : 'active:bg-white'
                  }`}
                  testID="init-cycle-next-month"
                >
                  <ChevronRight size={18} color="#6A6A6A" />
                </Pressable>
              </View>

              {/* Weekday headers */}
              <View className="flex-row justify-between border-b border-[#F0E5E1] pb-1">
                {WEEKDAYS.map((wd, i) => (
                  <View key={i} className="w-8 items-center">
                    <Text className="font-body-bold text-[11px] text-[#A0A0B0]">
                      {wd}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Month day grid */}
              <View className="mt-2 gap-y-1">
                {monthWeeks.map((week, wIdx) => (
                  <View key={wIdx} className="flex-row justify-between">
                    {week.map((dateStr, dIdx) => {
                      if (!dateStr) {
                        return <View key={dIdx} className="size-8" />;
                      }
                      const isSelected = dateStr === selectedDate;
                      const isFuture = dateStr > today;
                      const dayNumber = String(Number(dateStr.slice(-2)));

                      return (
                        <Pressable
                          key={dIdx}
                          disabled={isFuture}
                          onPress={() => setSelectedDate(dateStr)}
                          testID={`init-cycle-day-${dateStr}`}
                          className={`size-8 items-center justify-center rounded-full ${
                            isSelected
                              ? 'bg-[#FF9FA8]'
                              : isFuture
                                ? 'opacity-25'
                                : 'active:bg-[#FFE5E8]'
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isSelected
                                ? 'font-body-bold text-white'
                                : isFuture
                                  ? 'font-body text-[#A0A0B0]'
                                  : 'font-body-medium text-[#2A2321]'
                            }`}
                          >
                            {dayNumber}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Selected Date Indicator */}
            <View className="mt-3 flex-row items-center justify-between rounded-xl bg-[#FFE5E8]/50 px-4 py-2.5">
              <Text className="font-body text-xs text-[#8C8C8C]">
                Selected Date:
              </Text>
              <Text
                testID="init-cycle-selected-date"
                className="font-heading text-xs text-[#E06B78]"
              >
                {formatCalendarDate(selectedDate)}
              </Text>
            </View>

            {errorMessage && (
              <View className="mt-3 rounded-xl bg-red-50 p-2.5">
                <Text className="font-body text-xs text-red-600">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              disabled={initCycle.isPending}
              onPress={handleConfirm}
              testID="init-cycle-confirm-button"
              className="mt-5 h-13 flex-row items-center justify-center rounded-pill bg-[#FF9FA8] active:scale-[0.98]"
              style={{
                shadowColor: '#FF9FA8',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              {initCycle.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="font-body-bold text-base text-white">
                  Confirm & Start Cycle
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default InitializeCycleModal;
