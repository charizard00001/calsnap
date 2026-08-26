import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MealCard from '@/components/MealCard';
import MealDetailModal from '@/components/MealDetailModal';
import ArcadeBg from '@/components/ui/ArcadeBg';
import Chip from '@/components/ui/Chip';
import Marquee from '@/components/ui/Marquee';
import Sticker from '@/components/ui/Sticker';
import { Colors, Fonts, StatusRamp, rampFor } from '@/constants/theme';
import { useDailyLogsRange } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { sfx } from '@/lib/sfx';
import { DEFAULT_GOALS } from '@/lib/profile';
import type { DailyLog, MealEntry } from '@/types';
import { formatDisplayDate, getLastNDays, parseDateKey } from '@/utils/dateHelpers';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const { data: goals = DEFAULT_GOALS } = useGoals();

  const dates = useMemo(() => getLastNDays(30), []);
  const { data: logs = [], refetch, isRefetching } = useDailyLogsRange(dates);
  const selectedLog = selectedDate ? logs.find((l) => l.date === selectedDate) ?? null : null;

  const hitDays = logs.filter(
    (l) => l.totalCalories > 0 && l.totalCalories <= goals.calorieGoal
  ).length;

  const totals = (log: DailyLog | null) => ({
    kcal: log?.totalCalories ?? 0,
    p: log?.totalProtein ?? 0,
    c: log?.totalCarbs ?? 0,
    f: log?.totalFat ?? 0,
  });

  const sel = totals(selectedLog);
  const over = sel.kcal - goals.calorieGoal;

  return (
    <View style={styles.container}>
      <ArcadeBg glows={[Colors.accentSecondary, Colors.accentViolet]} />

      <View style={{ height: insets.top }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.accentSecondary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>THE TAPE</Text>
            <Text style={styles.subtitle}>LAST 30 DAYS OF EVIDENCE</Text>
          </View>
          <Sticker color={Colors.accentLime} radius={12} shadow={4} contentStyle={styles.hitCard}>
            <Text style={styles.hitNumber}>{hitDays}</Text>
            <Text style={styles.hitLabel}>HIT DAYS</Text>
          </Sticker>
        </View>

        <View style={styles.legendRow}>
          <Legend color={StatusRamp.under} label="UNDER GOAL" />
          <Legend color={StatusRamp.close} label="CLOSE" />
          <Legend color={StatusRamp.over} label="BLEW IT" />
        </View>

        <View style={styles.grid}>
          {logs.map((log, i) => {
            const date = dates[i];
            const dayDate = parseDateKey(date);
            const isSelected = selectedDate === date;
            const color = rampFor(log.totalCalories, goals.calorieGoal);
            const ink = log.totalCalories === 0 ? Colors.textMuted : Colors.ink;

            return (
              <Pressable
                key={date}
                onPress={() => {
                  sfx('tap');
                  setSelectedDate(isSelected ? null : date);
                }}
                style={styles.tileWrap}
              >
                {!isSelected && <View style={styles.tileShadow} />}
                <View
                  style={[
                    styles.tile,
                    { backgroundColor: color },
                    isSelected && styles.tileSelected,
                  ]}
                >
                  <Text style={[styles.dayNumber, { color: ink }]}>{dayDate.getDate()}</Text>
                  {log.totalCalories > 0 && (
                    <Text style={[styles.dayKcal, { color: ink }]}>{log.totalCalories}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {selectedLog && selectedDate && (
          <View>
            <Sticker color={Colors.paper} radius={24} shadow={6} border={4} contentStyle={styles.detail}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>
                  {formatDisplayDate(parseDateKey(selectedDate)).toUpperCase()}
                </Text>
                <Chip
                  label={
                    sel.kcal === 0
                      ? 'NOTHING LOGGED'
                      : over > 0
                        ? `OVER BY ${over}`
                        : `UNDER BY ${Math.abs(over)}`
                  }
                  color={
                    sel.kcal === 0
                      ? Colors.textMuted
                      : over > 0
                        ? StatusRamp.over
                        : StatusRamp.under
                  }
                />
              </View>

              <View style={styles.statRow}>
                <Stat label="KCAL" value={String(sel.kcal)} color={Colors.accentWarm} />
                <Stat label="PROTEIN" value={`${sel.p}g`} color={Colors.accentPrimary} />
                <Stat label="CARBS" value={`${sel.c}g`} color={Colors.accentGold} />
                <Stat label="FAT" value={`${sel.f}g`} color={Colors.accentCool} />
              </View>

              <View style={styles.divider} />

              {selectedLog.meals.length > 0 ? (
                selectedLog.meals.map((meal, i) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onPress={setSelectedMeal}
                    rotate={i % 2 === 0 ? -0.6 : 0.6}
                  />
                ))
              ) : (
                <Text style={styles.noMeals}>No meals logged this day</Text>
              )}
            </Sticker>
          </View>
        )}
      </ScrollView>

      <Marquee
        text="TAP A DAY ★ RELIVE THE DAMAGE"
        color={Colors.accentSecondary}
        duration={16}
        height={32}
      />

      <MealDetailModal
        meal={selectedMeal}
        date={selectedDate ?? ''}
        onClose={() => setSelectedMeal(null)}
      />
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color }]}>{label}</Text>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 34,
    color: Colors.paper,
  },
  subtitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Colors.textSecondary,
  },
  hitCard: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignItems: 'center',
  },
  hitNumber: {
    fontFamily: Fonts.display,
    fontSize: 17,
    lineHeight: 19,
    color: Colors.ink,
  },
  hitLabel: {
    fontFamily: Fonts.display,
    fontSize: 7,
    color: Colors.ink,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 7,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.cardBg,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: Colors.hairline,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  legendText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tileWrap: {
    width: '14.6%',
    aspectRatio: 1,
    position: 'relative',
  },
  tileShadow: {
    position: 'absolute',
    left: 3,
    top: 3,
    right: -3,
    bottom: -3,
    backgroundColor: Colors.ink,
    borderRadius: 12,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  tileSelected: {
    borderColor: Colors.paper,
  },
  dayNumber: {
    fontFamily: Fonts.display,
    fontSize: 12,
    lineHeight: 14,
  },
  dayKcal: {
    fontFamily: Fonts.bodyBold,
    fontSize: 7,
    opacity: 0.75,
  },
  detail: {
    padding: 16,
    gap: 13,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  detailTitle: {
    fontFamily: Fonts.display,
    fontSize: 17,
    color: Colors.ink,
  },
  statRow: {
    flexDirection: 'row',
    gap: 7,
  },
  stat: {
    flex: 1,
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: 14,
  },
  statLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 7,
    letterSpacing: 0.6,
    color: Colors.textSecondary,
  },
  divider: {
    height: 3,
    backgroundColor: Colors.ink,
    opacity: 0.15,
    borderRadius: 999,
  },
  noMeals: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
