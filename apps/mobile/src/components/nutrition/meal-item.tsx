import { Check, Flame, Utensils } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type MealEntry } from '@/store/useHealthStore';

export interface MealItemProps {
  meal: MealEntry;
  onToggle: (id: string) => void;
}

export const MealItem: React.FC<MealItemProps> = ({ meal, onToggle }) => {
  const isCompleted = meal.completed;

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'breakfast':
        return { label: 'BREAKFAST', color: '#FFB800' };
      case 'lunch':
        return { label: 'LUNCH', color: '#A3E6C8' };
      case 'dinner':
        return { label: 'DINNER', color: '#D7BBF5' };
      default:
        return { label: 'SNACK', color: '#FF7575' };
    }
  };

  const badge = getCategoryBadge(meal.category);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        isCompleted && styles.cardCompleted,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onToggle(meal.id)}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: `${badge.color}22` }]}>
          <Utensils size={10} color={badge.color} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: badge.color }]}>
            {badge.label}
          </Text>
        </View>

        <View style={styles.calorieRow}>
          <Flame size={12} color="#FF7575" />
          <Text style={styles.calorieText}>{meal.calories} kcal</Text>
        </View>
      </View>

      <Text
        style={[styles.mealTitle, isCompleted && styles.mealTitleCompleted]}
      >
        {meal.title}
      </Text>

      <Text style={styles.mealDescription}>{meal.description}</Text>

      <View style={styles.bottomRow}>
        <Pressable
          style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
          onPress={() => onToggle(meal.id)}
        >
          {isCompleted && <Check size={14} color="#121212" strokeWidth={3} />}
        </Pressable>

        <Text
          style={[
            styles.checkboxLabel,
            isCompleted && styles.checkboxLabelChecked,
          ]}
        >
          {isCompleted ? 'Completed' : 'Mark as Consumed'}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E1E24',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#33333E',
    marginBottom: 12,
  },
  cardCompleted: {
    borderColor: '#A3E6C844',
    backgroundColor: '#1A211D',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieText: {
    fontSize: 12,
    color: '#A0A0B0',
    fontWeight: '600',
    marginLeft: 3,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 20,
  },
  mealTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#A0A0B0',
  },
  mealDescription: {
    fontSize: 12,
    color: '#A0A0B0',
    lineHeight: 17,
    marginBottom: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2A2A32',
    paddingTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6E6E80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#A3E6C8',
    borderColor: '#A3E6C8',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#6E6E80',
    fontWeight: '600',
  },
  checkboxLabelChecked: {
    color: '#A3E6C8',
  },
});

export default MealItem;
