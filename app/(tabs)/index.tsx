import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import MacroCard from '@/components/MacroCard';
import MealCard from '@/components/MealCard';
import MealDetailModal from '@/components/MealDetailModal';
import ProgressRing from '@/components/ProgressRing';
import SyncStatusBadge from '@/components/SyncStatusBadge';
import ArcadeBg from '@/components/ui/ArcadeBg';
import Chip from '@/components/ui/Chip';
import Confetti from '@/components/ui/Confetti';
import Icon from '@/components/ui/Icon';
import Snappy from '@/components/ui/Snappy';
import Sticker from '@/components/ui/Sticker';
import StickerPressable from '@/components/ui/StickerPressable';
import Marquee from '@/components/ui/Marquee';
import { Colors, Fonts } from '@/constants/theme';
import { useDailyLog, useRemoveMeal } from '@/hooks/useDailyLog';
import { useGoals } from '@/hooks/useGoals';
import { DEFAULT_GOALS } from '@/lib/profile';
import type { DailyLog, MealEntry } from '@/types';
import { formatDisplayDate, getDayOfTraining, getTodayKey } from '@/utils/dateHelpers';

const emptyLog: DailyLog = {
  date: '',
  meals: [],
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
};

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = getTodayKey();
  const { data: todayLog = emptyLog, refetch, isRefetching } = useDailyLog(today);
  const { data: goals = DEFAULT_GOALS } = useGoals();
  const removeMealMutation = useRemoveMeal();
  const [selectedMeal, setSelectedMeal] = React.useState<MealEntry | null>(null);
  const [burst, setBurst] = React.useState(0);

  const dayNumber = getDayOfTraining(goals.installDate);
  const todayFormatted = formatDisplayDate(new Date());

  // The snap button wobbles so it never reads as a static chrome element.
  const wobble = useSharedValue(0);
  useEffect(() => {
    wobble.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 1300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [wobble]);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value * 3}deg` }],
  }));

  const handleAddMeal = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setBurst((n) => n + 1);
    router.push('/add-meal');
  }, [router]);

  const handleDeleteMeal = useCallback(
    (id: string) => {
      removeMealMutation.mutate({ date: today, mealId: id });
    },
    [removeMealMutation, today]
  );

  const proteinGoal = goals.proteinGoal;
  const carbsGoal = Math.round((goals.calorieGoal * 0.45) / 4);
  const fatGoal = Math.round((goals.calorieGoal * 0.25) / 9);

  const headerComponent = useMemo(
    () => (
      <>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
              <Sticker color={Colors.accentGold} radius={999} shadow={3} contentStyle={styles.streakPad}>
                <Icon name="flame" size={13} color={Colors.ink} />
                <Text style={styles.streakText}>DAY {dayNumber}</Text>
              </Sticker>
              <SyncStatusBadge />
            </View>

            <Text style={styles.greeting} numberOfLines={2}>
              HEY,{'\n'}
              {goals.name.toUpperCase()}
            </Text>
            <Text style={styles.dateText}>{todayFormatted.toUpperCase()}</Text>
          </View>

          <StickerPressable
            color={Colors.accentPrimary}
            radius={16}
            shadow={4}
            contentStyle={styles.gearPad}
            onPress={() => router.push('/(tabs)/settings')}
            accessibilityLabel="Profile"
          >
            <Icon name="gear" size={23} color={Colors.ink} />
          </StickerPressable>
        </View>

        <View style={styles.ringBlock}>
          <ProgressRing consumed={todayLog.totalCalories} goal={goals.calorieGoal} />
          <View style={styles.mascotPerch}>
            <Snappy size={62} mood={todayLog.meals.length > 0 ? 'ready' : 'flat'} />
          </View>
        </View>

        <View style={styles.macroRow}>
          <MacroCard
            label="Protein"
            fullLabel="Protein"
            icon="protein"
            color={Colors.accentPrimary}
            value={todayLog.totalProtein}
            goal={proteinGoal}
            delay={120}
            rotate={-1.6}
          />
          <MacroCard
            label="Carbs"
            fullLabel="Carbs"
            icon="carbs"
            color={Colors.accentGold}
            value={todayLog.totalCarbs}
            goal={carbsGoal}
            delay={260}
            rotate={1.2}
          />
          <MacroCard
            label="Fat"
            fullLabel="Fat"
            icon="fat"
            color={Colors.accentCool}
            value={todayLog.totalFat}
            goal={fatGoal}
            delay={400}
            rotate={-1}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY&apos;S HAUL</Text>
          <Chip
            label={`${todayLog.meals.length} LOGGED`}
            color={Colors.paper}
          />
        </View>
      </>
    ),
    [
      goals.name,
      goals.calorieGoal,
      dayNumber,
      todayFormatted,
      todayLog,
      proteinGoal,
      carbsGoal,
      fatGoal,
      router,
    ]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ArcadeBg glows={[Colors.accentPrimary, Colors.accentSecondary]} />

      <View style={[styles.topPad, { height: insets.top }]} />

      <Marquee
        text="SNAP IT ★ CHOMP IT ★ LOG IT"
        color={Colors.accentLime}
        duration={14}
        height={32}
      />

      <FlashList
        data={todayLog.meals}
        renderItem={({ item, index }) => (
          <MealCard
            meal={item}
            onDelete={handleDeleteMeal}
            onPress={setSelectedMeal}
            rotate={index % 2 === 0 ? -0.9 : 0.7}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={headerComponent}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <Sticker
            color={Colors.cardBg}
            border={3}
            borderColor={Colors.accentPrimary}
            shadow={0}
            radius={20}
            contentStyle={styles.emptyCard}
          >
            <Icon name="camera" size={32} color={Colors.accentPrimary} strokeWidth={2.4} />
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>NOTHING LOGGED YET</Text>
              <Text style={styles.emptyBody}>
                Snap your first plate and Snappy will do the maths.
              </Text>
            </View>
          </Sticker>
        }
      />

      <Animated.View
        style={[styles.fab, { bottom: 24 }, fabStyle]}
        pointerEvents="box-none"
      >
        <Confetti trigger={burst} count={14} spread={72} />
        <StickerPressable
          color={Colors.accentGold}
          radius={24}
          shadow={6}
          border={4}
          sound="boing"
          onPress={handleAddMeal}
          contentStyle={styles.fabInner}
          accessibilityLabel="Snap a meal"
        >
          <Icon name="camera" size={26} color={Colors.ink} />
          <Text style={styles.fabText}>SNAP</Text>
        </StickerPressable>
      </Animated.View>

      <MealDetailModal
        meal={selectedMeal}
        date={today}
        onClose={() => setSelectedMeal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  topPad: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 18,
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  streakPad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    fontFamily: Fonts.display,
    fontSize: 11,
    color: Colors.ink,
  },
  greeting: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    color: Colors.paper,
  },
  dateText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Colors.textSecondary,
  },
  gearPad: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  mascotPerch: {
    position: 'absolute',
    top: 0,
    right: 14,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.paper,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderStyle: 'dashed',
  },
  emptyCopy: {
    flex: 1,
    gap: 3,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: Colors.paper,
  },
  emptyBody: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 18,
    zIndex: 30,
  },
  fabInner: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  fabText: {
    fontFamily: Fonts.display,
    fontSize: 9,
    color: Colors.ink,
  },
});
