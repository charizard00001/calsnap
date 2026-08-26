import { Colors } from '@/constants/theme';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SHADES = [
  Colors.accentGold,
  Colors.accentSecondary,
  Colors.accentPrimary,
  Colors.accentLime,
  Colors.accentViolet,
  Colors.accentCool,
];

interface ConfettiProps {
  /** Bump this number to fire a fresh burst. */
  trigger: number;
  count?: number;
  spread?: number;
  duration?: number;
}

function Piece({
  trigger,
  index,
  count,
  spread,
  duration,
}: {
  trigger: number;
  index: number;
  count: number;
  spread: number;
  duration: number;
}) {
  const t = useSharedValue(0);

  const angle = (index / count) * Math.PI * 2;
  const distance = spread + (index % 4) * (spread * 0.28);
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance - spread * 0.3;
  const size = 8 + (index % 3) * 4;
  const spin = (index % 2 ? 1 : -1) * (180 + index * 23);

  useEffect(() => {
    if (!trigger) return;
    t.value = 0;
    t.value = withTiming(1, {
      duration,
      easing: Easing.bezier(0.15, 0.8, 0.3, 1),
    });
  }, [trigger, duration, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: dx * t.value },
      { translateY: dy * t.value },
      { scale: 0.4 + 0.6 * t.value },
      { rotate: `${spin * t.value}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          width: size,
          height: size,
          backgroundColor: SHADES[index % SHADES.length],
          borderRadius: index % 2 ? 3 : 999,
        },
        style,
      ]}
    />
  );
}

/**
 * A radial confetti burst, anchored to whatever it's placed on top of.
 * Fires on save and on a streak milestone — the two moments that earn it.
 */
export default function Confetti({
  trigger,
  count = 14,
  spread = 70,
  duration = 750,
}: ConfettiProps) {
  if (!trigger) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {Array.from({ length: count }, (_, i) => (
        <Piece
          key={i}
          trigger={trigger}
          index={i}
          count={count}
          spread={spread}
          duration={duration}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  piece: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
});
