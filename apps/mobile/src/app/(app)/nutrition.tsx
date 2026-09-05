import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Sparkles, Utensils, Flame, ShieldCheck } from 'lucide-react-native';
import { useHealthStore } from '@/store/useHealthStore';
import { MealItem } from '@/components/nutrition/MealItem';

export default function NutritionScreen() {
  const { meals, toggleMeal, generateNewDietPlan } = useHealthStore();
  const [generating, setGenerating] = useState(false);

  const completedCount = meals.filter((m) => m.completed).length;
  const totalCalories = meals.reduce((sum, m) => sum + (m.completed ? m.calories : 0), 0);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    await generateNewDietPlan();
    setGenerating(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Prenatal Diet Plan</Text>
          <Text style={styles.headerSubtitle}>Trimester 2 Tailored Micronutrients</Text>
        </View>

        <View style={styles.badge}>
          <Utensils size={12} color="#A3E6C8" style={{ marginRight: 4 }} />
          <Text style={styles.badgeText}>{completedCount}/{meals.length} Meals</Text>
        </View>
      </View>

      {/* Daily Progress Widget */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Consumed Calories</Text>
            <View style={styles.valRow}>
              <Flame size={16} color="#FF7575" style={{ marginRight: 4 }} />
              <Text style={styles.progressVal}>{totalCalories} / 2,200 kcal</Text>
            </View>
          </View>
          <View style={styles.progressItemRight}>
            <Text style={styles.progressLabel}>Folate Target</Text>
            <Text style={styles.progressValGreen}>600 mcg (100%)</Text>
          </View>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min((totalCalories / 2200) * 100, 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* Action Button: Generate AI Plan */}
      <Pressable
        style={({ pressed }) => [
          styles.generateButton,
          pressed && styles.generateButtonPressed,
          generating && styles.generateButtonDisabled,
        ]}
        onPress={handleGeneratePlan}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#121212" style={{ marginRight: 8 }} />
        ) : (
          <Sparkles size={18} color="#121212" style={{ marginRight: 8 }} />
        )}
        <Text style={styles.generateButtonText}>
          {generating ? 'Calculating Nutritional Plan...' : 'Generate Personal Plan'}
        </Text>
      </Pressable>

      {/* Meal List Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daily Meal Schedule</Text>
        <Text style={styles.sectionSubtitle}>Check off as you consume</Text>
      </View>

      {/* Meal List Component */}
      {meals.map((meal) => (
        <MealItem key={meal.id} meal={meal} onToggle={toggleMeal} />
      ))}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A0A0B0',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A3E6C822',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A3E6C8',
  },
  progressCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#33333E',
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressItem: {},
  progressItemRight: {
    alignItems: 'flex-end',
  },
  progressLabel: {
    fontSize: 11,
    color: '#6E6E80',
    fontWeight: '600',
    marginBottom: 2,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressValGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A3E6C8',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#2A2A32',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF7575',
    borderRadius: 4,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A3E6C8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: '#A3E6C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#6E6E80',
  },
});
