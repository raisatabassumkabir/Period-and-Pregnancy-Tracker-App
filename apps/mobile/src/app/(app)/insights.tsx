import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import { BookOpen, ShieldCheck, Heart, Trash2, ArrowRight } from 'lucide-react-native';
import { useHealthStore } from '@/store/useHealthStore';
import { EncryptedHealthStorage } from '@/lib/storage/encrypted-storage';

export default function InsightsScreen() {
  const { currentWeek, babySizeLabel } = useHealthStore();

  const handlePurgeData = () => {
    Alert.alert(
      'Purge Encrypted Health Data',
      'This will instantly delete all local encrypted symptom logs, kick counts, and offline data from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge Everything',
          style: 'destructive',
          onPress: async () => {
            await EncryptedHealthStorage.purgeAllHealthData();
            Alert.alert('Data Purged', 'Local encrypted health data has been completely erased.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pregnancy Insights</Text>
        <Text style={styles.headerSubtitle}>Week {currentWeek} Development & Guides</Text>
      </View>

      {/* Main Feature Article Card */}
      <View style={styles.articleCard}>
        <View style={styles.articleTag}>
          <BookOpen size={12} color="#D7BBF5" style={{ marginRight: 4 }} />
          <Text style={styles.articleTagText}>WEEK {currentWeek} GUIDE</Text>
        </View>

        <Text style={styles.articleTitle}>
          Your Baby's Hearing is Developing Rapidly in Week {currentWeek}
        </Text>
        <Text style={styles.articleSnippet}>
          At week {currentWeek}, your baby is roughly the size of a {babySizeLabel}. Inner ear bones are fully formed, meaning your baby can now hear your heartbeat, voice, and surroundings!
        </Text>

        <Pressable style={styles.readMoreButton}>
          <Text style={styles.readMoreText}>Read Full Article</Text>
          <ArrowRight size={14} color="#D7BBF5" />
        </Pressable>
      </View>

      {/* Zero Knowledge Security Card */}
      <View style={styles.privacyCard}>
        <View style={styles.privacyHeader}>
          <ShieldCheck size={22} color="#A3E6C8" />
          <Text style={styles.privacyTitle}>Zero-Knowledge Encrypted</Text>
        </View>
        <Text style={styles.privacyBody}>
          Your sensitive reproductive health metrics are hardware-encrypted on disk with SecureStore keys. No third party can read your symptom logs.
        </Text>

        <Pressable style={styles.purgeButton} onPress={handlePurgeData}>
          <Trash2 size={14} color="#FF4D4D" style={{ marginRight: 6 }} />
          <Text style={styles.purgeButtonText}>Purge Local Health Data</Text>
        </Pressable>
      </View>
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
  articleCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#33333E',
    marginBottom: 16,
  },
  articleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D7BBF522',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  articleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D7BBF5',
    letterSpacing: 0.5,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleSnippet: {
    fontSize: 13,
    color: '#A0A0B0',
    lineHeight: 19,
    marginBottom: 16,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D7BBF5',
    marginRight: 4,
  },
  privacyCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#A3E6C844',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#A3E6C8',
    marginLeft: 8,
  },
  privacyBody: {
    fontSize: 12,
    color: '#A0A0B0',
    lineHeight: 18,
    marginBottom: 16,
  },
  purgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4D4D15',
    borderWidth: 1,
    borderColor: '#FF4D4D44',
    paddingVertical: 10,
    borderRadius: 14,
  },
  purgeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF4D4D',
  },
});
