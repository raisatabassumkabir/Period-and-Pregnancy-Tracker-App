import React from 'react';
import { StyleSheet, Text, View, Switch, Pressable } from 'react-native';
import {
  Footprints,
  Activity,
  BatteryLow,
  ShieldAlert,
  Droplets,
  Smile,
  Heart,
  Zap,
} from 'lucide-react-native';
import { SymptomEntry } from '@/store/useHealthStore';

export interface LoggedItemProps {
  symptom: SymptomEntry;
  onToggle: (id: string) => void;
}

const getIconComponent = (iconName: string, color: string) => {
  const size = 20;
  switch (iconName) {
    case 'Footprints':
      return <Footprints size={size} color={color} />;
    case 'Activity':
      return <Activity size={size} color={color} />;
    case 'BatteryLow':
      return <BatteryLow size={size} color={color} />;
    case 'ShieldAlert':
      return <ShieldAlert size={size} color={color} />;
    case 'Droplets':
      return <Droplets size={size} color={color} />;
    case 'Smile':
      return <Smile size={size} color={color} />;
    default:
      return <Heart size={size} color={color} />;
  }
};

export const LoggedItem: React.FC<LoggedItemProps> = ({ symptom, onToggle }) => {
  const isLogged = symptom.logged;
  const accentColor = isLogged ? '#FF7575' : '#6E6E80';

  const getIntensityBadge = (intensity: 'mild' | 'moderate' | 'severe') => {
    switch (intensity) {
      case 'mild':
        return { label: 'Mild', bg: '#A3E6C822', color: '#A3E6C8' };
      case 'moderate':
        return { label: 'Moderate', bg: '#FFB80022', color: '#FFB800' };
      case 'severe':
        return { label: 'Severe', bg: '#FF4D4D22', color: '#FF4D4D' };
    }
  };

  const badge = getIntensityBadge(symptom.intensity);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        isLogged && styles.cardLogged,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onToggle(symptom.id)}
    >
      <View style={[styles.iconWrapper, { backgroundColor: isLogged ? '#FF757522' : '#2A2A32' }]}>
        {getIconComponent(symptom.icon, accentColor)}
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.titleText, isLogged && styles.titleTextLogged]}>{symptom.name}</Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.intensityBadge, { backgroundColor: badge.bg }]}>
            <Zap size={10} color={badge.color} style={{ marginRight: 3 }} />
            <Text style={[styles.intensityText, { color: badge.color }]}>{badge.label}</Text>
          </View>

          <Text style={styles.categoryText}>{symptom.category.toUpperCase()}</Text>
        </View>
      </View>

      <Switch
        value={isLogged}
        onValueChange={() => onToggle(symptom.id)}
        trackColor={{ false: '#33333E', true: '#FF757577' }}
        thumbColor={isLogged ? '#FF7575' : '#A0A0B0'}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#33333E',
    marginBottom: 10,
  },
  cardLogged: {
    borderColor: '#FF757555',
    backgroundColor: '#1E1E24',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    marginBottom: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0B0',
  },
  titleTextLogged: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  intensityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  categoryText: {
    fontSize: 10,
    color: '#6E6E80',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default LoggedItem;
