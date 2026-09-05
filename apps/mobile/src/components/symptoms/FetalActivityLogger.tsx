import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Footprints, Plus, RotateCcw, Check, Clock } from 'lucide-react-native';
import { useHealthStore } from '@/store/useHealthStore';

export const FetalActivityLogger: React.FC = () => {
  const {
    activeKickCount,
    kickSessionActive,
    incrementKick,
    resetKickSession,
    saveKickSession,
    kickLogs,
  } = useHealthStore();

  const buttonScale = useSharedValue(1);

  const handlePressKick = () => {
    buttonScale.value = withSequence(
      withTiming(0.92, { duration: 80, easing: Easing.ease }),
      withTiming(1.08, { duration: 120, easing: Easing.ease }),
      withTiming(1.0, { duration: 100, easing: Easing.ease })
    );
    incrementKick();
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <View style={styles.iconCircle}>
            <Footprints size={18} color="#FF7575" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Fetal Activity Counter</Text>
            <Text style={styles.sectionSubtitle}>Target: 10 kicks within 2 hours</Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>
            {kickSessionActive ? 'Active Session' : 'Ready'}
          </Text>
        </View>
      </View>

      {/* Counter Main Display */}
      <View style={styles.displayCard}>
        <Text style={styles.countText}>{activeKickCount}</Text>
        <Text style={styles.countLabel}>Kicks Logged This Session</Text>

        {/* Kick Button */}
        <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
          <Pressable style={styles.kickButton} onPress={handlePressKick}>
            <Plus size={24} color="#121212" style={{ marginRight: 6 }} />
            <Text style={styles.kickButtonText}>+ Log Kick</Text>
          </Pressable>
        </Animated.View>

        {/* Action Controls */}
        {activeKickCount > 0 && (
          <View style={styles.controlsRow}>
            <Pressable style={styles.controlButtonSecondary} onPress={resetKickSession}>
              <RotateCcw size={14} color="#A0A0B0" style={{ marginRight: 4 }} />
              <Text style={styles.controlTextSecondary}>Reset</Text>
            </Pressable>

            <Pressable style={styles.controlButtonPrimary} onPress={saveKickSession}>
              <Check size={14} color="#121212" style={{ marginRight: 4 }} />
              <Text style={styles.controlTextPrimary}>Save Session</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* History Log */}
      {kickLogs.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Kick Sessions</Text>
          {kickLogs.slice(0, 2).map((log) => (
            <View key={log.id} style={styles.historyRow}>
              <View style={styles.historyTimeCol}>
                <Clock size={12} color="#6E6E80" style={{ marginRight: 4 }} />
                <Text style={styles.historyTimeText}>{log.timestamp}</Text>
              </View>
              <Text style={styles.historyCountText}>{log.count} kicks</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#33333E',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FF757522',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#A0A0B0',
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: '#A3E6C822',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A3E6C8',
  },
  displayCard: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A32',
  },
  countText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FF7575',
    letterSpacing: -1,
  },
  countLabel: {
    fontSize: 12,
    color: '#A0A0B0',
    fontWeight: '500',
    marginBottom: 16,
  },
  buttonWrapper: {
    width: '100%',
  },
  kickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7575',
    paddingVertical: 14,
    borderRadius: 28,
    width: '100%',
    shadowColor: '#FF7575',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  kickButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 14,
  },
  controlButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A32',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  controlTextSecondary: {
    color: '#A0A0B0',
    fontSize: 13,
    fontWeight: '600',
  },
  controlButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A3E6C8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    flex: 1.5,
    justifyContent: 'center',
  },
  controlTextPrimary: {
    color: '#121212',
    fontSize: 13,
    fontWeight: '700',
  },
  historyContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A32',
    paddingTop: 12,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6E6E80',
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyTimeCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTimeText: {
    fontSize: 12,
    color: '#A0A0B0',
  },
  historyCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A3E6C8',
  },
});

export default FetalActivityLogger;
