import React, { useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Appear } from '@/components/Appear';
import ParticleBackground from '@/components/ParticleBackground';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useDailyLogsRange } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { DEFAULT_GOALS } from '@/lib/profile';
import { getLastNDays } from '@/utils/dateHelpers';

export default function InsightsScreen() {
  const { data: goals = DEFAULT_GOALS } = useGoals();
  const dates = useMemo(() => getLastNDays(7), []);
  const { data: logs = [] } = useDailyLogsRange(dates);
  const weekLogs = useMemo(() => [...logs].reverse(), [logs]); // oldest first for chart

  const avgCalories = weekLogs.length
    ? Math.round(weekLogs.reduce((s, l) => s + l.totalCalories, 0) / weekLogs.length)
    : 0;
  const avgProtein = weekLogs.length
    ? Math.round(weekLogs.reduce((s, l) => s + l.totalProtein, 0) / weekLogs.length)
    : 0;

  // Streak calculation
  const streakDates = useMemo(() => getLastNDays(30), []);
  const { data: streakLogs = [] } = useDailyLogsRange(streakDates);
  const streak = useMemo(() => {
    let count = 0;
    for (const log of streakLogs) {
      if (log.meals.length > 0) count++;
      else break;
    }
    return count;
  }, [streakLogs]);

  // Best / worst day
  const bestDay = weekLogs.length
    ? weekLogs.reduce((best, log) =>
        log.totalCalories > 0 && log.totalCalories < (best?.totalCalories || Infinity)
          ? log
          : best,
        weekLogs[0]
      )
    : null;
  const worstDay = weekLogs.length
    ? weekLogs.reduce((worst, log) =>
        log.totalCalories > (worst?.totalCalories || 0) ? log : worst,
        weekLogs[0]
      )
    : null;

  const maxCal = Math.max(...weekLogs.map((l) => l.totalCalories), goals.calorieGoal, 1);

  return (
    <View style={styles.container}>
      <ParticleBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Your last 7 days</Text>

        {/* Stats summary */}
        <Appear style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Avg Calories</Text>
            <Text style={[styles.summaryValue, { color: Colors.accentWarm }]}>
              {avgCalories}
            </Text>
            <Text style={styles.summaryUnit}>kcal/day</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Avg Protein</Text>
            <Text style={[styles.summaryValue, { color: Colors.accentHot }]}>
              {avgProtein}
            </Text>
            <Text style={styles.summaryUnit}>g protein/day</Text>
          </View>
        </Appear>

        {/* Streak */}
        <Appear delay={200} style={styles.streakCard}>
          <Text style={styles.streakLabel}>Day Streak</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakEmoji}>
              {streak > 7 ? '🔥' : streak > 3 ? '⚡' : '💫'}
            </Text>
          </View>
          {streak > 7 && (
            <Text style={styles.streakBonus}>You're on a roll!</Text>
          )}
        </Appear>

        {/* Bar chart */}
        <Appear delay={400} style={styles.chartSection}>
          <Text style={styles.chartTitle}>Calories · Last 7 Days</Text>
          <View style={styles.chartContainer}>
            {weekLogs.map((log, i) => {
              const dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][
                new Date(log.date + 'T00:00:00').getDay() === 0
                  ? 6
                  : new Date(log.date + 'T00:00:00').getDay() - 1
              ] || log.date.slice(-2);

              const heightPct = (log.totalCalories / maxCal) * 100;
              const goalPct = (goals.calorieGoal / maxCal) * 100;
              const isOverGoal = log.totalCalories > goals.calorieGoal;

              return (
                <View key={log.date} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    {/* Goal line */}
                    <View
                      style={[
                        styles.goalLine,
                        { bottom: `${goalPct}%` as any },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(heightPct, 2)}%` as any,
                          backgroundColor: isOverGoal
                            ? Colors.accentHot
                            : log.totalCalories > 0
                            ? Colors.accentPrimary
                            : Colors.textMuted + '30',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>
                    {log.totalCalories > 0 ? log.totalCalories : '-'}
                  </Text>
                  <Text style={styles.barLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </Appear>

        {/* Best / Worst day */}
        <Appear delay={600} style={styles.highlightRow}>
          {bestDay && bestDay.totalCalories > 0 && (
            <View style={[styles.highlightCard, { borderColor: Colors.success + '40' }]}>
              <Text style={styles.highlightLabel}>Best Day</Text>
              <Text style={[styles.highlightValue, { color: Colors.success }]}>
                {bestDay.totalCalories} kcal
              </Text>
              <Text style={styles.highlightDate}>{bestDay.date}</Text>
            </View>
          )}
          {worstDay && worstDay.totalCalories > 0 && (
            <View style={[styles.highlightCard, { borderColor: Colors.accentHot + '40' }]}>
              <Text style={styles.highlightLabel}>Peak Output</Text>
              <Text style={[styles.highlightValue, { color: Colors.accentHot }]}>
                {worstDay.totalCalories} kcal
              </Text>
              <Text style={styles.highlightDate}>{worstDay.date}</Text>
            </View>
          )}
        </Appear>
      </ScrollView>
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
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accentPrimary + '20',
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FontSizes.xxxl,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  summaryUnit: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  streakCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accentGold + '30',
    marginBottom: Spacing.md,
  },
  streakLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  streakNumber: {
    fontSize: FontSizes.display,
    fontWeight: '900',
    color: Colors.accentGold,
    fontVariant: ['tabular-nums'],
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakBonus: {
    fontSize: FontSizes.sm,
    color: Colors.accentHot,
    fontWeight: '700',
    marginTop: 4,
  },
  chartSection: {
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 180,
    gap: Spacing.xs,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accentPrimary + '15',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: '80%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  goalLine: {
    position: 'absolute',
    left: -4,
    right: -4,
    height: 1,
    backgroundColor: Colors.textMuted + '50',
    zIndex: 1,
  },
  barValue: {
    fontSize: 8,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  barLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
  },
  highlightLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  highlightValue: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  highlightDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
