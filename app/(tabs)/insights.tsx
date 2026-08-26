import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import ArcadeBg from '@/components/ui/ArcadeBg';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import Marquee from '@/components/ui/Marquee';
import Snappy from '@/components/ui/Snappy';
import Sticker from '@/components/ui/Sticker';
import { Colors, Fonts, StatusRamp, rampFor } from '@/constants/theme';
import { useDailyLogsRange } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { sfx } from '@/lib/sfx';
import { DEFAULT_GOALS } from '@/lib/profile';
import { getLastNDays, parseDateKey } from '@/utils/dateHelpers';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const CHART_HEIGHT = 132;

function Bar({
  height,
  color,
  selected,
  delay,
}: {
  height: number;
  color: string;
  selected: boolean;
  delay: number;
}) {
  const grow = useSharedValue(0);
  React.useEffect(() => {
    grow.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.bezier(0.2, 0.9, 0.25, 1) })
    );
  }, [delay, grow, height]);

  // The bar's real height is laid out statically and the animation scales it
  // from the baseline. Animating the height value itself doesn't take on
  // Reanimated's web renderer — the bars stayed pinned at their minimum.
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: grow.value }],
  }));

  return (
    <View style={[styles.barSlot, { height: Math.max(height, 3) }]}>
      <Animated.View
        style={[
          styles.bar,
          { backgroundColor: color },
          selected && styles.barSelected,
          style,
        ]}
      />
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { data: goals = DEFAULT_GOALS } = useGoals();
  const dates = useMemo(() => getLastNDays(7), []);
  const { data: logs = [] } = useDailyLogsRange(dates);
  const [sel, setSel] = useState(0);

  // getLastNDays is newest-first; the chart reads left-to-right in time.
  const week = useMemo(() => [...logs].reverse(), [logs]);
  const weekDates = useMemo(() => [...dates].reverse(), [dates]);

  const logged = week.filter((l) => l.totalCalories > 0);
  const avgCalories = logged.length
    ? Math.round(logged.reduce((s, l) => s + l.totalCalories, 0) / logged.length)
    : 0;
  const avgProtein = logged.length
    ? Math.round(logged.reduce((s, l) => s + l.totalProtein, 0) / logged.length)
    : 0;

  const maxCal = Math.max(goals.calorieGoal * 1.3, ...week.map((l) => l.totalCalories), 1);
  const goalPct = goals.calorieGoal / maxCal;

  const best = logged.reduce<(typeof logged)[number] | null>(
    (acc, l) => (!acc || l.totalCalories < acc.totalCalories ? l : acc),
    null
  );
  const worst = logged.reduce<(typeof logged)[number] | null>(
    (acc, l) => (!acc || l.totalCalories > acc.totalCalories ? l : acc),
    null
  );

  const streak = (() => {
    let n = 0;
    for (const log of logs) {
      if (log.totalCalories > 0) n++;
      else break;
    }
    return n;
  })();

  const selected = week[sel];
  const selDiff = (selected?.totalCalories ?? 0) - goals.calorieGoal;

  return (
    <View style={styles.container}>
      <ArcadeBg glows={[Colors.accentGold, Colors.accentWarm]} />

      <View style={{ height: insets.top }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>THE DAMAGE</Text>
            <Text style={styles.subtitle}>YOUR LAST 7 DAYS, UNEDITED</Text>
          </View>
          <Snappy size={52} mood={avgCalories > goals.calorieGoal ? 'flat' : 'ready'} color={Colors.accentGold} />
        </View>

        <View style={styles.statPair}>
          <Sticker color={Colors.accentWarm} radius={18} shadow={5} rotate={-1.4} style={styles.flex} contentStyle={styles.statCard}>
            <Text style={styles.statCaption}>AVG PER DAY</Text>
            <Text style={styles.statBig}>{avgCalories}</Text>
            <Text style={styles.statSub}>
              {avgCalories === 0
                ? 'nothing logged yet'
                : avgCalories > goals.calorieGoal
                  ? `${avgCalories - goals.calorieGoal} over goal`
                  : `${goals.calorieGoal - avgCalories} under goal`}
            </Text>
          </Sticker>
          <Sticker color={Colors.accentPrimary} radius={18} shadow={5} rotate={1.1} style={styles.flex} contentStyle={styles.statCard}>
            <Text style={styles.statCaption}>AVG PROTEIN</Text>
            <Text style={styles.statBig}>
              {avgProtein}
              <Text style={styles.statBigUnit}>g</Text>
            </Text>
            <Text style={styles.statSub}>
              {avgProtein >= goals.proteinGoal
                ? 'target cleared'
                : `${goals.proteinGoal - avgProtein}g short of ${goals.proteinGoal}`}
            </Text>
          </Sticker>
        </View>

        <Sticker color={Colors.accentViolet} radius={22} shadow={6} border={4} contentStyle={styles.streakCard}>
          <View style={styles.streakLeft}>
            <Text style={styles.statCaption}>CURRENT STREAK</Text>
            <View style={styles.streakRow}>
              <Text style={styles.streakBig}>{streak}</Text>
              <Text style={styles.streakUnit}>DAYS</Text>
            </View>
            <Text style={styles.statSub}>
              {streak === 0 ? 'Log something to start one.' : 'Keep the chain going.'}
            </Text>
          </View>
          <Icon name="flame" size={46} color={Colors.ink} strokeWidth={2} />
        </Sticker>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>CALORIES · LAST 7 DAYS</Text>
            <Text style={styles.chartNote}>
              Dashed line is your {goals.calorieGoal} goal
            </Text>
          </View>

          <View style={styles.legendRow}>
            <Legend color={StatusRamp.under} label="Under" />
            <Legend color={StatusRamp.close} label="Close" />
            <Legend color={StatusRamp.over} label="Over" />
          </View>

          <View style={styles.chart}>
            <View style={[styles.goalLine, { bottom: goalPct * CHART_HEIGHT + 22 }]} />
            {week.map((log, i) => {
              const h = (log.totalCalories / maxCal) * CHART_HEIGHT;
              const color = rampFor(log.totalCalories, goals.calorieGoal);
              const isSel = sel === i;
              const label = DAY_LABELS[parseDateKey(weekDates[i]).getDay()];
              return (
                <Pressable
                  key={weekDates[i]}
                  onPress={() => {
                    sfx('tap');
                    setSel(i);
                  }}
                  style={styles.barColumn}
                >
                  <Text style={[styles.barValue, isSel && styles.barValueSel]}>
                    {log.totalCalories > 0 ? log.totalCalories : '—'}
                  </Text>
                  <Bar height={h} color={color} selected={isSel} delay={i * 60} />
                  <Text style={[styles.barLabel, isSel && styles.barLabelSel]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.readout}>
            <View
              style={[
                styles.readoutDot,
                { backgroundColor: rampFor(selected?.totalCalories ?? 0, goals.calorieGoal) },
              ]}
            />
            <Text style={styles.readoutText}>
              {selected
                ? `${DAY_LABELS[parseDateKey(weekDates[sel]).getDay()]} · ${selected.totalCalories} kcal · ${
                    selDiff > 0 ? `${selDiff} over goal` : `${Math.abs(selDiff)} under goal`
                  }`
                : 'No data yet'}
            </Text>
          </View>
        </View>

        {best && worst && (
          <View style={styles.statPair}>
            <Sticker color={Colors.accentSecondary} radius={18} shadow={5} style={styles.flex} contentStyle={styles.statCard}>
              <View style={styles.iconRow}>
                <Icon name="check" size={14} color={Colors.ink} strokeWidth={2.8} />
                <Text style={styles.smallCaps}>BEST DAY</Text>
              </View>
              <Text style={styles.midBig}>{best.totalCalories}</Text>
              <Text style={styles.statSub}>
                {formatShort(best.date)}
              </Text>
            </Sticker>
            <Sticker color={Colors.accentHot} radius={18} shadow={5} style={styles.flex} contentStyle={styles.statCard}>
              <View style={styles.iconRow}>
                <Icon name="warning" size={14} color={Colors.ink} strokeWidth={2.8} />
                <Text style={styles.smallCaps}>BIG ONE</Text>
              </View>
              <Text style={styles.midBig}>{worst.totalCalories}</Text>
              <Text style={styles.statSub}>{formatShort(worst.date)}</Text>
            </Sticker>
          </View>
        )}

        {logged.length === 0 && (
          <Sticker color={Colors.paper} radius={20} shadow={6} border={4} contentStyle={styles.emptyCard}>
            <Chip label="NOTHING TO CRUNCH" color={Colors.accentViolet} />
            <Text style={styles.emptyBody}>
              Log a few meals and this page fills in with your real week.
            </Text>
          </Sticker>
        )}
      </ScrollView>

      <Marquee
        text="NUMBERS DON'T LIE ★ THE BIRYANI WAS WORTH IT"
        color={Colors.accentGold}
        duration={15}
        height={32}
      />
    </View>
  );
}

function formatShort(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
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
    gap: 15,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 10,
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
  statPair: {
    flexDirection: 'row',
    gap: 11,
  },
  statCard: {
    padding: 13,
    gap: 2,
  },
  statCaption: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.ink,
  },
  statBig: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 32,
    color: Colors.ink,
  },
  statBigUnit: {
    fontSize: 14,
  },
  midBig: {
    fontFamily: Fonts.display,
    fontSize: 20,
    lineHeight: 24,
    color: Colors.ink,
  },
  statSub: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.ink,
    opacity: 0.72,
  },
  smallCaps: {
    fontFamily: Fonts.display,
    fontSize: 9,
    color: Colors.ink,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
  },
  streakLeft: {
    flex: 1,
    gap: 1,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
  },
  streakBig: {
    fontFamily: Fonts.display,
    fontSize: 42,
    lineHeight: 46,
    color: Colors.ink,
  },
  streakUnit: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.paper,
  },
  chartCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: Colors.hairline,
    padding: 15,
    gap: 12,
  },
  chartHeader: {
    gap: 2,
  },
  chartTitle: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: Colors.paper,
  },
  chartNote: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.textSecondary,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: CHART_HEIGHT + 44,
    position: 'relative',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.textMuted,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    justifyContent: 'flex-end',
  },
  barSlot: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    transformOrigin: 'center bottom',
  },
  barSelected: {
    borderWidth: 2,
    borderColor: Colors.paper,
  },
  barValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.textMuted,
  },
  barValueSel: {
    color: Colors.paper,
  },
  barLabel: {
    fontFamily: Fonts.display,
    fontSize: 8,
    color: Colors.textSecondary,
  },
  barLabelSel: {
    color: Colors.paper,
  },
  readout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopWidth: 2,
    borderTopColor: Colors.hairline,
    paddingTop: 10,
  },
  readoutDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  readoutText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.paper,
    flex: 1,
  },
  emptyCard: {
    padding: 15,
    gap: 8,
  },
  emptyBody: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ink,
  },
});
