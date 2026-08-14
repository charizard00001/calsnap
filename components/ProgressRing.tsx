import { Colors, FontSizes } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Circle as SvgCircle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

interface ProgressRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({
  consumed,
  goal,
  size = 220,
  strokeWidth = 14,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(goal, 1), 1.5); // cap at 150% visually
  const remaining = Math.max(goal - consumed, 0);
  const percentage = consumed / Math.max(goal, 1);

  // Determine color based on percentage
  let ringColor = Colors.accentCool; // Under 75%
  let gradientId = 'blue';
  if (percentage >= 1) {
    ringColor = Colors.accentHot;
    gradientId = 'red';
  } else if (percentage >= 0.75) {
    ringColor = Colors.accentWarm;
    gradientId = 'orange';
  }

  // Pulse animation when over limit
  const pulseScale = useSharedValue(1);
  React.useEffect(() => {
    if (percentage >= 1) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [percentage >= 1]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - Math.min(progress, 1)),
  }));

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, pulseStyle]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="blue" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.accentCool} />
            <Stop offset="1" stopColor={Colors.accentSecondary} />
          </LinearGradient>
          <LinearGradient id="orange" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.accentWarm} />
            <Stop offset="1" stopColor={Colors.accentGold} />
          </LinearGradient>
          <LinearGradient id="red" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.accentHot} />
            <Stop offset="1" stopColor={Colors.accentWarm} />
          </LinearGradient>
        </Defs>

        {/* Background ring */}
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.cardBg}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress ring */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center text */}
      <View style={styles.centerText}>
        <Text style={[styles.calorieNumber, { color: ringColor }]}>
          {consumed}
        </Text>
        <Text style={styles.label}>Calories</Text>
        <Text style={styles.remaining}>{remaining} left</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  calorieNumber: {
    fontSize: FontSizes.display,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  remaining: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
});
