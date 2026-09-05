import { Calendar, Sparkles } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FetalActivityLogger } from '@/components/symptoms/fetal-activity-logger';
import { LoggedItem } from '@/components/symptoms/logged-item';
import { useHealthStore } from '@/store/useHealthStore';

export default function SymptomsScreen() {
  const { symptoms, toggleSymptom } = useHealthStore();

  const loggedCount = symptoms.filter((s) => s.logged).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Symptom Logger</Text>
          <View style={styles.dateRow}>
            <Calendar size={13} color="#FF7575" style={{ marginRight: 4 }} />
            <Text style={styles.dateText}>Today, September 6</Text>
          </View>
        </View>

        <View style={styles.loggedBadge}>
          <Sparkles size={12} color="#A3E6C8" style={{ marginRight: 4 }} />
          <Text style={styles.loggedBadgeText}>{loggedCount} Logged</Text>
        </View>
      </View>

      {/* Fetal Activity Section (Image 4 Middle Screen) */}
      <FetalActivityLogger />

      {/* Symptoms List Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daily Physical & Mood Logs</Text>
        <Text style={styles.sectionSubtitle}>Tap card or toggle to update</Text>
      </View>

      {/* Reusable LoggedItem Components */}
      {symptoms.map((item) => (
        <LoggedItem key={item.id} symptom={item} onToggle={toggleSymptom} />
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#A0A0B0',
    fontWeight: '500',
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A3E6C822',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  loggedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A3E6C8',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
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
