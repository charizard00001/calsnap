import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import type { NutritionResult } from '@/types';
import { confidenceToGrade } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface NutritionResultCardProps {
  result: NutritionResult;
  onUpdate: (updated: NutritionResult) => void;
}

export default function NutritionResultCard({
  result,
  onUpdate,
}: NutritionResultCardProps) {
  const grade = confidenceToGrade(result.confidence);
  const gradeColor =
    grade === 'S'
      ? Colors.success
      : grade === 'A'
      ? Colors.accentCool
      : grade === 'B'
      ? Colors.accentGold
      : Colors.accentHot;

  const updateField = (field: keyof NutritionResult, value: string) => {
    const numFields = ['calories', 'protein', 'carbs', 'fat'] as const;
    if ((numFields as readonly string[]).includes(field)) {
      const num = parseInt(value, 10);
      onUpdate({ ...result, [field]: isNaN(num) ? 0 : num });
    } else {
      onUpdate({ ...result, [field]: value });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with food name and grade */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.foodName}>{result.foodName}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {result.description}
          </Text>
          <Text style={styles.serving}>{result.servingSize}</Text>
        </View>
        <View style={[styles.gradeBadge, { borderColor: gradeColor }]}>
          <Text style={[styles.gradeLabel, { color: gradeColor }]}>Grade</Text>
          <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatRow
          label="⚡ Calories"
          value={String(result.calories)}
          unit="kcal"
          color={Colors.accentWarm}
          onChangeText={(v) => updateField('calories', v)}
        />
        <StatRow
          label="💪 STR (Protein)"
          value={String(result.protein)}
          unit="g"
          color={Colors.accentHot}
          onChangeText={(v) => updateField('protein', v)}
        />
        <StatRow
          label="⚡ AGI (Carbs)"
          value={String(result.carbs)}
          unit="g"
          color={Colors.accentGold}
          onChangeText={(v) => updateField('carbs', v)}
        />
        <StatRow
          label="🛡️ DEF (Fat)"
          value={String(result.fat)}
          unit="g"
          color={Colors.accentCool}
          onChangeText={(v) => updateField('fat', v)}
        />
      </View>
    </View>
  );
}

function StatRow({
  label,
  value,
  unit,
  color,
  onChangeText,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <TextInput
          style={[styles.statInput, { color }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <Text style={[styles.statUnit, { color: color + '80' }]}>{unit}</Text>
      </View>
      {/* Progress bar */}
      <View style={styles.statBar}>
        <LinearGradient
          colors={[color, color + '60']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.statBarFill,
            { width: `${Math.min((parseInt(value, 10) || 0) / (unit === 'kcal' ? 20 : 1.5), 100)}%` as any },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accentPrimary + '30',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  foodName: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  serving: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  gradeBadge: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
  },
  gradeLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  gradeText: {
    fontSize: FontSizes.xxl,
    fontWeight: '900',
  },
  statsGrid: {
    gap: Spacing.sm,
  },
  statRow: {
    gap: 4,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statInput: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    padding: 0,
    minWidth: 50,
  },
  statUnit: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  statBar: {
    height: 4,
    backgroundColor: Colors.primaryBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
