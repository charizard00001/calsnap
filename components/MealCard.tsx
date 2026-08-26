import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import {
  Colors,
  Fonts,
  MealTypeColor,
  MealTypeShort,
  Sticker as S,
} from '@/constants/theme';
import { sfx } from '@/lib/sfx';
import type { MealEntry } from '@/types';
import { formatTime } from '@/utils/dateHelpers';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface MealCardProps {
  meal: MealEntry;
  onDelete?: (id: string) => void;
  onPress?: (meal: MealEntry) => void;
  rotate?: number;
}

export default function MealCard({ meal, onDelete, onPress, rotate = 0 }: MealCardProps) {
  const translateX = useSharedValue(0);
  const deleteThreshold = -100;

  const handleDelete = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    sfx('down');
    onDelete?.(meal.id);
  };

  const handlePress = () => {
    sfx('tap');
    onPress?.(meal);
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

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handlePress)();
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.abs(translateX.value) / 100, 1),
  }));

  const typeColor = MealTypeColor[meal.mealType] ?? Colors.accentGold;
  const typeLabel = MealTypeShort[meal.mealType] ?? 'MEAL';

  // Deliberately no `entering` animation: Reanimated's web layout animations
  // intermittently paint a stuck low-opacity first frame that never clears,
  // and a half-invisible meal row reads as a broken card.
  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.deleteBackground, deleteStyle]}>
        <Icon name="trash" size={20} color={Colors.paper} />
        <Text style={styles.deleteText}>DELETE</Text>
      </Animated.View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            cardStyle,
            rotate ? { transform: [{ rotate: `${rotate}deg` }] } : null,
          ]}
        >
          <View style={styles.shadow} />
          <View style={styles.card}>
            {meal.photoUri ? (
              <Image source={{ uri: meal.photoUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder, { backgroundColor: typeColor }]}>
                <Icon name="plate" size={28} color={Colors.ink} strokeWidth={2.4} />
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.foodName} numberOfLines={1}>
                {meal.foodName.toUpperCase()}
              </Text>

              <View style={styles.chipRow}>
                <Chip
                  label={`${meal.calories} KCAL`}
                  color={Colors.accentPrimary}
                  size="sm"
                />
                <Chip label={`${meal.protein}P`} color={Colors.accentSecondary} size="sm" />
                <Chip label={typeLabel} color={typeColor} size="sm" />
              </View>

              <Text style={styles.time}>{formatTime(meal.timestamp)}</Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 13,
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: Colors.accentHot,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteText: {
    fontFamily: Fonts.display,
    fontSize: 10,
    color: Colors.paper,
  },
  shadow: {
    position: 'absolute',
    left: S.shadow,
    top: S.shadow,
    right: -S.shadow,
    bottom: -S.shadow,
    backgroundColor: Colors.ink,
    borderRadius: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 11,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.ink,
    backgroundColor: Colors.paper,
  },
  photo: {
    width: 62,
    height: 62,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: Colors.ink,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  foodName: {
    fontFamily: Fonts.display,
    fontSize: 14,
    lineHeight: 17,
    color: Colors.ink,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  time: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.textMuted,
  },
});
