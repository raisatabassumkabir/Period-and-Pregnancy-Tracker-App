import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Bell, Calendar, ChevronDown, Activity } from 'lucide-react-native';
import { useHealthStore } from '@/store/useHealthStore';
import { CircularPregnancyTimeline } from '@/components/dashboard/CircularPregnancyTimeline';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { ModeSwitcherModal } from '@/components/dashboard/ModeSwitcherModal';

export default function DashboardScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const {
    mode,
    currentWeek,
    currentDay,
    babySizeLabel,
    babyLengthCm,
    babyWeightGrams,
    dueDate,
    daysRemaining,
    loadEncryptedState,
  } = useHealthStore();

  useEffect(() => {
    loadEncryptedState();
  }, []);

  const isPregnancy = mode === 'pregnancy';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <Text style={styles.greetingText}>Welcome back 👋</Text>
          <Text style={styles.userNameText}>Sarah Jenkins</Text>
        </View>

        {/* Dynamic Mode Pill Switcher */}
        <Pressable style={styles.modeChip} onPress={() => setModalVisible(true)}>
          <Sparkles size={12} color="#FF7575" style={{ marginRight: 4 }} />
          <Text style={styles.modeChipText}>
            {isPregnancy ? 'Pregnancy' : 'Cycle Tracking'}
          </Text>
          <ChevronDown size={14} color="#A0A0B0" style={{ marginLeft: 2 }} />
        </Pressable>
      </View>

      {/* Mode Specific Timeline Visualizer */}
      {isPregnancy ? (
        <CircularPregnancyTimeline
          currentWeek={currentWeek}
          currentDayInWeek={currentDay}
          dueDate={dueDate}
          daysRemaining={daysRemaining}
          babySizeLabel={babySizeLabel}
          babyLengthCm={babyLengthCm}
          babyWeightGrams={babyWeightGrams}
          onPressLogSymptoms={() => router.push('/(app)/symptoms' as any)}
        />
      ) : (
        <View style={styles.cycleCard}>
          <View style={styles.cycleHeader}>
            <Calendar size={20} color="#A3E6C8" />
            <Text style={styles.cycleTitle}>Cycle Day 14</Text>
          </View>
          <Text style={styles.cycleSubtitle}>Estimated Ovulation Window Today</Text>
          <View style={styles.cyclePill}>
            <Text style={styles.cyclePillText}>High Fertility Window</Text>
          </View>
        </View>
      )}

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Snapshot</Text>
        <Text style={styles.sectionSubtitle}>Synced with Health Encryption</Text>
      </View>

      {/* Status Cards Row */}
      <View style={styles.statusCardsRow}>
        <StatusCard
          type="baby_size"
          title="Baby Size"
          subtitle={`Size of a ${babySizeLabel}`}
          badgeText={`${babyWeightGrams}g`}
          badgeColor="#A3E6C8"
          detailPrimary={`${babyLengthCm} cm est. length`}
          onPress={() => router.push('/(app)/insights' as any)}
        />

        <StatusCard
          type="appointment"
          title="Next Visit"
          subtitle="24-Week Ultrasound"
          badgeText="In 4 Days"
          badgeColor="#FF7575"
          detailPrimary="Dr. Emily Roberts"
          onPress={() => router.push('/(app)/insights' as any)}
        />
      </View>

      {/* Mode Switcher Modal */}
      <ModeSwitcherModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  userSection: {},
  greetingText: {
    fontSize: 12,
    color: '#A0A0B0',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#33333E',
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cycleCard: {
    backgroundColor: '#1E1E24',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#33333E',
    alignItems: 'center',
    marginBottom: 20,
  },
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cycleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  cycleSubtitle: {
    fontSize: 13,
    color: '#A0A0B0',
    marginBottom: 12,
  },
  cyclePill: {
    backgroundColor: '#A3E6C822',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cyclePillText: {
    color: '#A3E6C8',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#6E6E80',
    fontWeight: '500',
  },
  statusCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
