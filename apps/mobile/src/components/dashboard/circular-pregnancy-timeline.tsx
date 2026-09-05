import { Calendar, Heart, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularPregnancyTimelineProps {
  currentWeek: number; // e.g. 24
  currentDayInWeek?: number; // 0 to 6
  totalWeeks?: number; // Default 40 weeks
  dueDate?: string; // e.g., "Oct 15, 2026"
  daysRemaining?: number; // e.g., 112
  babySizeLabel?: string; // e.g., "Cantaloupe"
  babyLengthCm?: number; // e.g., 30.0
  babyWeightGrams?: number; // e.g., 600
  onPressLogSymptoms?: () => void;
}

export const CircularPregnancyTimeline: React.FC<
  CircularPregnancyTimelineProps
> = ({
  currentWeek = 24,
  currentDayInWeek = 3,
  totalWeeks = 40,
  dueDate = 'Oct 15, 2026',
  daysRemaining = 112,
  babySizeLabel = 'Cantaloupe',
  babyLengthCm = 30,
  babyWeightGrams = 600,
  onPressLogSymptoms,
}) => {
  // Trimester Calculation
  const getTrimesterInfo = (week: number) => {
    if (week <= 12) return { num: 1, label: '1st Trimester', color: '#A3E6C8' };
    if (week <= 27) return { num: 2, label: '2nd Trimester', color: '#FF7575' };
    return { num: 3, label: '3rd Trimester', color: '#D7BBF5' };
  };

  const trimester = getTrimesterInfo(currentWeek);

  // Circle Dimensions
  const circleSize = 270;
  const strokeWidth = 16;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate Progress (0.0 to 1.0)
  const progressRatio = Math.min(
    Math.max((currentWeek + currentDayInWeek / 7) / totalWeeks, 0.02),
    1
  );
  const strokeDashoffsetTarget = circumference * (1 - progressRatio);

  // React Native Core Animated Values (100% compatible with Expo Go & Web)
  const animatedProgress = useRef(new Animated.Value(circumference)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: strokeDashoffsetTarget,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.06,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1.0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [animatedProgress, pulseScale, strokeDashoffsetTarget]);

  return (
    <View style={styles.container}>
      {/* SVG Ring Visualizer */}
      <View style={styles.ringWrapper}>
        <Svg
          width={circleSize}
          height={circleSize}
          viewBox={`0 0 ${circleSize} ${circleSize}`}
        >
          <Defs>
            <LinearGradient
              id="gradientRing"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#FF7575" stopOpacity="1" />
              <Stop offset="60%" stopColor="#FF9E9E" stopOpacity="1" />
              <Stop offset="100%" stopColor="#A3E6C8" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Background Track Circle */}
          <Circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke="#2A2A32"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Animated Active Progress Arc */}
          <AnimatedCircle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke="url(#gradientRing)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={animatedProgress}
            strokeLinecap="round"
            transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
          />
        </Svg>

        {/* Central Overlay Information Card */}
        <View style={styles.centerContent}>
          {/* Trimester Chip */}
          <View
            style={[
              styles.trimesterBadge,
              { backgroundColor: `${trimester.color}22` },
            ]}
          >
            <Sparkles
              size={12}
              color={trimester.color}
              style={styles.badgeIcon}
            />
            <Text style={[styles.trimesterText, { color: trimester.color }]}>
              {trimester.label.toUpperCase()}
            </Text>
          </View>

          {/* Main Week Text */}
          <View style={styles.weekRow}>
            <Text style={styles.weekNumberText}>Week {currentWeek}</Text>
            <Text style={styles.dayText}>+{currentDayInWeek} days</Text>
          </View>

          {/* Baby Size Graphic Indicator */}
          <Animated.View
            style={[
              styles.babySizeContainer,
              { transform: [{ scale: pulseScale }] },
            ]}
          >
            <View style={styles.babyIconWrapper}>
              <Heart size={16} color="#FF7575" fill="#FF7575" />
            </View>
            <Text style={styles.babySizeText}>Size of a {babySizeLabel}</Text>
          </Animated.View>

          {/* Days Remaining Counter Badge */}
          <View style={styles.daysBadge}>
            <Calendar size={13} color="#A0A0B0" />
            <Text style={styles.daysBadgeText}>{daysRemaining} days to go</Text>
          </View>
        </View>
      </View>

      {/* Secondary Metrics Bar */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Est. Length</Text>
          <Text style={styles.metricValue}>{babyLengthCm} cm</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Est. Weight</Text>
          <Text style={styles.metricValue}>{babyWeightGrams} g</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Due Date</Text>
          <Text style={styles.metricValue}>{dueDate}</Text>
        </View>
      </View>

      {/* Prominent Action Button */}
      {onPressLogSymptoms && (
        <Pressable
          style={({ pressed }) => [
            styles.logButton,
            pressed && styles.logButtonPressed,
          ]}
          onPress={onPressLogSymptoms}
        >
          <Heart
            size={18}
            color="#121212"
            fill="#121212"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.logButtonText}>Log Kicks & Symptoms</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  ringWrapper: {
    width: 270,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 210,
    height: 210,
  },
  trimesterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  badgeIcon: {
    marginRight: 4,
  },
  trimesterText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  weekRow: {
    alignItems: 'center',
    marginVertical: 2,
  },
  weekNumberText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A0A0B0',
    marginTop: -2,
  },
  babySizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#33333E',
  },
  babyIconWrapper: {
    marginRight: 6,
  },
  babySizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF7575',
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  daysBadgeText: {
    fontSize: 11,
    color: '#A0A0B0',
    marginLeft: 4,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#33333E',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6E6E80',
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#33333E',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7575',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    marginTop: 18,
    shadowColor: '#FF7575',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  logButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  logButtonText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default CircularPregnancyTimeline;
