import Icon, { type IconName } from '@/components/ui/Icon';
import Sticker from '@/components/ui/Sticker';
import { Colors, Fonts } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface MacroCardProps {
  label: string;
  fullLabel: string;
  value: number;
  goal: number;
  color: string;
  icon: IconName;
  unit?: string;
  /** Stagger for the bar fill, in ms. */
  delay?: number;
  rotate?: number;
}

/** One macro as a coloured sticker with an ink-tracked progress bar. */
export default function MacroCard({
  label,
  value,
  goal,
  color,
  icon,
  unit = 'g',
  delay = 0,
  rotate = 0,
}: MacroCardProps) {
  const target = Math.min(value / Math.max(goal, 1), 1);
  const fill = useSharedValue(0);

  React.useEffect(() => {
    fill.value = withDelay(
      delay,
      withTiming(target, { duration: 1000, easing: Easing.bezier(0.2, 0.9, 0.25, 1) })
    );
  }, [target, delay, fill]);

  // Animating scaleX rather than a percentage width: Reanimated's web
  // renderer doesn't reliably apply animated percentage widths, which left
  // the bars empty. transformOrigin pins the growth to the left edge.
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.value }],
  }));

  return (
    <Sticker
      color={color}
      rotate={rotate}
      radius={16}
      shadow={4}
      style={styles.wrap}
      contentStyle={styles.card}
    >
      <View style={styles.headerRow}>
        <Icon name={icon} size={14} color={Colors.ink} strokeWidth={2.6} />
        <Text style={styles.label} numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.value}>
        {value}
        <Text style={styles.unit}>{unit}</Text>
      </Text>

      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, fillStyle]} />
      </View>

      <Text style={styles.goalText}>
        of {goal}
        {unit}
      </Text>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  card: {
    padding: 9,
    gap: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 9,
    color: Colors.ink,
    flexShrink: 1,
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 24,
    color: Colors.ink,
  },
  unit: {
    fontSize: 11,
  },
  barTrack: {
    height: 9,
    backgroundColor: Colors.ink,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    width: '100%',
    backgroundColor: Colors.paper,
    transformOrigin: 'left center',
  },
  goalText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.ink,
    opacity: 0.7,
  },
});
