import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Calendar, Heart, ChevronRight, Clock, Stethoscope } from 'lucide-react-native';

export interface StatusCardProps {
  type: 'baby_size' | 'appointment';
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeColor?: string;
  detailPrimary?: string;
  detailSecondary?: string;
  onPress?: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  type,
  title,
  subtitle,
  badgeText,
  badgeColor = '#A3E6C8',
  detailPrimary,
  detailSecondary,
  onPress,
}) => {
  const isBabySize = type === 'baby_size';

  return (
    <Pressable
      style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrapper, { backgroundColor: isBabySize ? '#A3E6C822' : '#FF757522' }]}>
          {isBabySize ? (
            <Heart size={20} color="#A3E6C8" fill="#A3E6C8" />
          ) : (
            <Calendar size={20} color="#FF7575" />
          )}
        </View>

        {badgeText && (
          <View style={[styles.badge, { backgroundColor: `${badgeColor}22` }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
          </View>
        )}
      </View>

      <View style={styles.contentSection}>
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.subtitleText}>{subtitle}</Text>
      </View>

      {(detailPrimary || detailSecondary) && (
        <View style={styles.footerRow}>
          {detailPrimary && (
            <View style={styles.detailItem}>
              {isBabySize ? <Clock size={12} color="#6E6E80" /> : <Stethoscope size={12} color="#6E6E80" />}
              <Text style={styles.detailText}>{detailPrimary}</Text>
            </View>
          )}

          <ChevronRight size={16} color="#6E6E80" />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#33333E',
    flex: 1,
    marginHorizontal: 4,
    justify: 'space-between',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  contentSection: {
    marginBottom: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A0A0B0',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2A2A32',
    paddingTop: 8,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 11,
    color: '#6E6E80',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default StatusCard;
