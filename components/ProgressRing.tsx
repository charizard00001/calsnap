import { Colors, Fonts, rampFor } from '@/constants/theme';
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
import Svg, { Circle as SvgCircle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

interface ProgressRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * The calorie ring, arcade edition: a fat stroke on a dotted track, ringed
 * in ink so it reads as one solid object rather than a thin gauge.
 */
export default function ProgressRing({
  consumed,
  goal,
  size = 224,
  strokeWidth = 20,
}: ProgressRingProps) {
  const radius = (size - strokeWidth - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(goal, 1), 1);
  const remaining = Math.max(goal - consumed, 0);
  const over = consumed > goal;
  const ringColor = rampFor(consumed, goal);

  // Pulse when over the limit — the one place the ring nags.
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    if (over) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [over, pulse]);

  const sweep = useSharedValue(0);
  React.useEffect(() => {
    sweep.value = withTiming(progress, {
      duration: 1400,
      easing: Easing.bezier(0.2, 0.9, 0.25, 1),
    });
  }, [progress, sweep]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - sweep.value),
  }));

  const centre = size / 2;

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, pulseStyle]}>
      <Svg width={size} height={size}>
        {/* Ink outline around the whole dial */}
        <SvgCircle
          cx={centre}
          cy={centre}
          r={radius + strokeWidth / 2 + 4}
          fill="none"
          stroke={Colors.ink}
          strokeWidth={4}
        />
        <SvgCircle
          cx={centre}
          cy={centre}
          r={radius - strokeWidth / 2 - 2}
          fill={Colors.cardBg}
          stroke={Colors.ink}
          strokeWidth={5}
        />
        {/* Dotted track */}
        <SvgCircle
          cx={centre}
          cy={centre}
          r={radius}
          fill="none"
          stroke={Colors.hairline}
          strokeWidth={strokeWidth}
          strokeDasharray="4 12"
          strokeLinecap="round"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={centre}
          cy={centre}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${centre} ${centre})`}
        />
      </Svg>

      <View style={styles.centerText}>
        <Text style={styles.calorieNumber}>{consumed}</Text>
        <Text style={[styles.label, { color: ringColor }]}>CALORIES IN</Text>
        <View style={[styles.pill, { backgroundColor: ringColor }]}>
          <Text style={styles.pillText}>
            {over ? `${consumed - goal} OVER` : `${remaining} LEFT`}
          </Text>
        </View>
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
    fontFamily: Fonts.display,
    fontSize: 46,
    lineHeight: 50,
    color: Colors.paper,
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 1,
  },
  pill: {
    marginTop: 7,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: Colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: {
    fontFamily: Fonts.display,
    fontSize: 10,
    color: Colors.ink,
  },
});
