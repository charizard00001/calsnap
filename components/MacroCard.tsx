import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MacroCardProps {
  label: string;        // STR, AGI, DEF
  fullLabel: string;    // Strength, Agility, Defense
  value: number;
  goal: number;
  color: string;
  gradient: readonly [string, string];
  emoji: string;
  unit?: string;
}

export default function MacroCard({
  label,
  fullLabel,
  value,
  goal,
  color,
  gradient,
  emoji,
  unit = 'g',
}: MacroCardProps) {
  const progress = Math.min(value / Math.max(goal, 1), 1);

  return (
    <View style={[styles.card, { borderColor: color + '40' }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>

      {/* Value */}
      <Text style={styles.value}>
        {value}
        <Text style={styles.unit}>{unit}</Text>
      </Text>
      <Text style={styles.fullLabel}>{fullLabel}</Text>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <LinearGradient
          colors={[gradient[0], gradient[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${progress * 100}%` as any }]}
        />
      </View>

      <Text style={styles.goalText}>
        / {goal}{unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  value: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: FontSizes.sm,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  fullLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  barTrack: {
    height: 6,
    backgroundColor: Colors.primaryBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
