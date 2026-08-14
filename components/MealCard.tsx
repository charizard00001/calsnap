import { BorderRadius, Colors, FontSizes, MealTypeLabels, Spacing } from '@/constants/theme';
import type { MealEntry } from '@/types';
import { formatTime } from '@/utils/dateHelpers';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeIn,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface MealCardProps {
  meal: MealEntry;
  onDelete?: (id: string) => void;
}

export default function MealCard({ meal, onDelete }: MealCardProps) {
  const translateX = useSharedValue(0);
  const deleteThreshold = -100;

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete?.(meal.id);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX(-10)
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -150);
      }
    })
    .onEnd((e) => {
      if (e.translationX < deleteThreshold) {
        translateX.value = withTiming(-400, { duration: 300 });
        runOnJS(handleDelete)();
      } else {
        translateX.value = withTiming(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.abs(translateX.value) / 100, 1),
  }));

  const mealInfo = MealTypeLabels[meal.mealType] || { label: 'Meal', rank: 'Unknown' };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.wrapper}>
      {/* Delete background */}
      <Animated.View style={[styles.deleteBackground, deleteStyle]}>
        <Text style={styles.deleteText}>🗑 Delete</Text>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardStyle}>
          <LinearGradient
            colors={[Colors.cardBg, Colors.secondaryBg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Photo */}
            {meal.photoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: meal.photoUri }} style={styles.photo} />
              </View>
            ) : (
              <View style={[styles.photoContainer, styles.photoPlaceholder]}>
                <Text style={styles.photoPlaceholderText}>🍽️</Text>
              </View>
            )}

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.foodName} numberOfLines={1}>
                {meal.foodName}
              </Text>
              <Text style={styles.rank}>{mealInfo.rank}</Text>

              <View style={styles.statsRow}>
                <Text style={styles.stat}>⚡ {meal.calories} kcal</Text>
                <Text style={styles.stat}>💪 {meal.protein}g</Text>
              </View>

              <Text style={styles.time}>{formatTime(meal.timestamp)}</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: Colors.accentHot + '30',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: Colors.accentHot,
    fontWeight: '700',
    fontSize: FontSizes.md,
  },
  card: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accentPrimary + '20',
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.primaryBg,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.sm,
    justifyContent: 'center',
  },
  foodName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rank: {
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  stat: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  time: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
