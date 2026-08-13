import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import MacroCard from '@/components/MacroCard';
import MealCard from '@/components/MealCard';
import ParticleBackground from '@/components/ParticleBackground';
import ProgressRing from '@/components/ProgressRing';
import { Colors, FontSizes, Gradients, MacroThemes, Spacing } from '@/constants/theme';
import { useMealStore } from '@/store/useMealStore';
import { formatDisplayDate, getDayOfTraining } from '@/utils/dateHelpers';

export default function DashboardScreen() {
  const router = useRouter();
  const { todayLog, goals, loadToday, removeMeal } = useMealStore();

  useEffect(() => {
    loadToday();
  }, []);

  const dayNumber = getDayOfTraining(goals.installDate);
  const todayFormatted = formatDisplayDate(new Date());
  const isOverLimit = todayLog.totalCalories > goals.calorieGoal;

  // FAB pulse animation
  const fabScale = useSharedValue(1);
  useEffect(() => {
    fabScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleAddMeal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/add-meal');
  }, []);

  const handleDeleteMeal = useCallback(
    (id: string) => {
      removeMeal(id);
    },
    [removeMeal]
  );

  const proteinGoal = goals.proteinGoal;
  // Rough estimates for carbs/fat goals based on calorie goal
  const carbsGoal = Math.round((goals.calorieGoal * 0.45) / 4);
  const fatGoal = Math.round((goals.calorieGoal * 0.25) / 9);

  const headerComponent = (
    <>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <View>
          <Text style={styles.sorcererName}>Sorcerer: {goals.name}</Text>
          <Text style={styles.dayCounter}>Day {dayNumber} of Training</Text>
          <Text style={styles.dateText}>{todayFormatted}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/settings')}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </Animated.View>

      {/* Calorie Ring */}
      <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.ringContainer}>
        <ProgressRing consumed={todayLog.totalCalories} goal={goals.calorieGoal} />
      </Animated.View>

      {/* Macro Cards */}
      <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.macroRow}>
        <MacroCard
          {...MacroThemes.protein}
          value={todayLog.totalProtein}
          goal={proteinGoal}
        />
        <MacroCard
          {...MacroThemes.carbs}
          value={todayLog.totalCarbs}
          goal={carbsGoal}
        />
        <MacroCard
          {...MacroThemes.fat}
          value={todayLog.totalFat}
          goal={fatGoal}
        />
      </Animated.View>

      {/* Section title */}
      <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Consumed Techniques</Text>
        <Text style={styles.mealCount}>{todayLog.meals.length} logged</Text>
      </Animated.View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ParticleBackground />

      {/* Over-limit red overlay */}
      {isOverLimit && <View style={styles.overLimitOverlay} />}

      <FlashList
        data={todayLog.meals}
        renderItem={({ item }) => (
          <MealCard meal={item} onDelete={handleDeleteMeal} />
        )}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        ListHeaderComponent={headerComponent}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>No techniques consumed yet</Text>
            <Text style={styles.emptySubtext}>Tap + to capture your first meal</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <Animated.View style={[styles.fab, fabStyle]}>
        <Pressable onPress={handleAddMeal}>
          <LinearGradient
            colors={Gradients.purpleToBlue}
            style={styles.fabGradient}
          >
            <Text style={styles.fabText}>+</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    marginBottom: Spacing.lg,
  },
  sorcererName: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dayCounter: {
    fontSize: FontSizes.md,
    color: Colors.jjkPurple,
    fontWeight: '600',
    marginTop: 4,
  },
  dateText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  macroRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  mealCount: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: 4,
  },
  overLimitOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.demonRed + '10',
    pointerEvents: 'none',
    zIndex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.lg,
    zIndex: 10,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.jjkPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: Colors.textPrimary,
    fontWeight: '300',
    marginTop: -2,
  },
});
