import { Colors, Fonts } from '@/constants/theme';
import { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface MarqueeProps {
  text: string;
  color?: string;
  textColor?: string;
  /** Seconds for one full pass. */
  duration?: number;
  height?: number;
  style?: ViewStyle;
}

/**
 * The scrolling ticker strip. One per screen, never two — two competing
 * marquees read as a broken page rather than a loud one.
 *
 * The copy is rendered twice side by side and the pair is translated by
 * exactly half its width, so the loop is seamless without measuring.
 */
export default function Marquee({
  text,
  color = Colors.accentLime,
  textColor = Colors.ink,
  duration = 13,
  height = 32,
  style,
}: MarqueeProps) {
  const shift = useSharedValue(0);
  const run = `${text}   ★   `.repeat(3);

  useEffect(() => {
    shift.value = 0;
    shift.value = withRepeat(
      withTiming(1, { duration: duration * 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, [duration, shift]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${-50 * shift.value}%` }],
  }));

  return (
    <View style={[styles.wrap, { backgroundColor: color, height }, style]}>
      <Animated.View style={[styles.row, animStyle]}>
        <Text style={[styles.text, { color: textColor }]}>{run}</Text>
        <Text style={[styles.text, { color: textColor }]}>{run}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: Colors.ink,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // The pair must be free to exceed the strip's width — shrinking it is
    // what made the copy truncate instead of tile.
    flexShrink: 0,
  },
  text: {
    fontFamily: Fonts.display,
    fontSize: 11,
    letterSpacing: 0.5,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  } as any,
});
