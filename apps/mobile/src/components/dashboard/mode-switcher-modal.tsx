import { Calendar, Check, Heart, X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { type AppMode, useHealthStore } from '@/store/useHealthStore';

export interface ModeSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ModeSwitcherModal: React.FC<ModeSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const { mode, setMode } = useHealthStore();

  const handleSelectMode = (newMode: AppMode) => {
    setMode(newMode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Select Tracking Mode</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color="#A0A0B0" />
            </Pressable>
          </View>
          <Text style={styles.modalSubtitle}>
            Customize your dashboard metrics, symptom logging, and dynamic tabs.
          </Text>

          {/* Option 1: Pregnancy Mode */}
          <Pressable
            style={[
              styles.optionCard,
              mode === 'pregnancy' && styles.optionCardActive,
            ]}
            onPress={() => handleSelectMode('pregnancy')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FF757522' }]}>
              <Heart size={22} color="#FF7575" fill="#FF7575" />
            </View>
            <View style={styles.optionTextContent}>
              <Text style={styles.optionTitle}>Pregnancy Tracking</Text>
              <Text style={styles.optionDescription}>
                Weekly baby growth, trimester countdown, kick counter & fetal
                activity.
              </Text>
            </View>
            {mode === 'pregnancy' && <Check size={20} color="#FF7575" />}
          </Pressable>

          {/* Option 2: Cycle Tracking Mode */}
          <Pressable
            style={[
              styles.optionCard,
              mode === 'cycle' && styles.optionCardActive,
            ]}
            onPress={() => handleSelectMode('cycle')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#A3E6C822' }]}>
              <Calendar size={22} color="#A3E6C8" />
            </View>
            <View style={styles.optionTextContent}>
              <Text style={styles.optionTitle}>Cycle & Period Tracking</Text>
              <Text style={styles.optionDescription}>
                Ovulation window, period prediction, ovulation symptoms & cycle
                history.
              </Text>
            </View>
            {mode === 'cycle' && <Check size={20} color="#A3E6C8" />}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#33333E',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#A0A0B0',
    marginBottom: 20,
    lineHeight: 18,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A32',
    marginBottom: 12,
  },
  optionCardActive: {
    borderColor: '#FF7575',
    backgroundColor: '#FF75750D',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextContent: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: '#6E6E80',
    lineHeight: 16,
  },
});

export default ModeSwitcherModal;
