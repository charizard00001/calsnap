import React, { useMemo, useState } from 'react';
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import MealCard from '@/components/MealCard';
import MealDetailModal from '@/components/MealDetailModal';
import ParticleBackground from '@/components/ParticleBackground';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useDailyLogsRange } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { DEFAULT_GOALS } from '@/lib/profile';
import type { DailyLog, MealEntry } from '@/types';
import { formatDisplayDate, getLastNDays, parseDateKey } from '@/utils/dateHelpers';

export default function HistoryScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const { data: goals = DEFAULT_GOALS } = useGoals();

  const dates = useMemo(() => getLastNDays(30), []);
  const { data: logs = [], refetch, isRefetching } = useDailyLogsRange(dates);
  const selectedLog = selectedDate ? logs.find((l) => l.date === selectedDate) ?? null : null;

  const getColorForDay = (log: DailyLog): string => {
    if (log.totalCalories === 0) return Colors.textMuted;
    const pct = log.totalCalories / goals.calorieGoal;
    if (pct <= 0.9) return Colors.success;
    if (pct <= 1.0) return Colors.accentGold;
    return Colors.accentHot;
  };

  return (
    <View style={styles.container}>
      <ParticleBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.accentPrimary}
          />
        }
      >
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Last 30 days</Text>

        {/* Calendar grid */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.calendarGrid}>
          {logs.map((log, i) => {
            const date = dates[i];
            const dayDate = parseDateKey(date);
            const dayNum = dayDate.getDate();
            const isSelected = selectedDate === date;
            const color = getColorForDay(log);

            return (
              <Pressable
                key={date}
                onPress={() => setSelectedDate(isSelected ? null : date)}
                style={[
                  styles.dayTile,
                  isSelected && styles.dayTileSelected,
                ]}
              >
                <Text style={[styles.dayNumber, { color: isSelected ? Colors.textPrimary : color }]}>
                  {dayNum}
                </Text>
                {log.totalCalories > 0 && (
                  <Text style={[styles.dayKcal, { color: color + 'AA' }]}>
                    {log.totalCalories}
                  </Text>
                )}
                {/* Glow dot */}
                {log.totalCalories > 0 && (
                  <View style={[styles.glowDot, { backgroundColor: color }]} />
                )}
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Selected day detail */}
        {selectedLog && selectedDate && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.detailSection}>
            <Text style={styles.detailTitle}>
              📜 {formatDisplayDate(parseDateKey(selectedDate))}
            </Text>

            <View style={styles.detailStats}>
              <StatBadge label="Energy" value={`${selectedLog.totalCalories} kcal`} color={Colors.accentWarm} />
              <StatBadge label="STR" value={`${selectedLog.totalProtein}g`} color={Colors.accentHot} />
              <StatBadge label="AGI" value={`${selectedLog.totalCarbs}g`} color={Colors.accentGold} />
              <StatBadge label="DEF" value={`${selectedLog.totalFat}g`} color={Colors.accentCool} />
            </View>

            {selectedLog.meals.length > 0 ? (
              selectedLog.meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} onPress={setSelectedMeal} />
              ))
            ) : (
              <Text style={styles.noMeals}>No meals logged this day</Text>
            )}
          </Animated.View>
        )}
      </ScrollView>

      <MealDetailModal
        meal={selectedMeal}
        date={selectedDate ?? ''}
        onClose={() => setSelectedMeal(null)}
      />
    </View>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statBadge, { borderColor: color + '40' }]}>
      <Text style={[styles.statLabel, { color: color + 'AA' }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dayTile: {
    width: '13%',
    aspectRatio: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  dayTileSelected: {
    borderColor: Colors.accentPrimary,
    backgroundColor: Colors.accentPrimary + '15',
  },
  dayNumber: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  dayKcal: {
    fontSize: 8,
    fontVariant: ['tabular-nums'],
  },
  glowDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  detailSection: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accentPrimary + '20',
  },
  detailTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  detailStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBadge: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  statValue: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  noMeals: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
