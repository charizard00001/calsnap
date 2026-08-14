import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface CrazyButtonProps {
  onPress: () => void;
  children: ReactNode;
  gradient?: readonly [string, string, ...string[]];
  glowColor?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'filled' | 'outline';
  textColor?: string;
  style?: ViewStyle;
}

export default function CrazyButton({
  onPress,
  children,
  gradient = Gradients_purpleToBlue,
  glowColor,
  disabled = false,
  loading = false,
  variant = 'filled',
  textColor = Colors.textPrimary,
  style,
}: CrazyButtonProps) {
  const pressed = useSharedValue(0); // 0..1, drives scale + glow while held
  const sweep = useSharedValue(-1); // -1..1, sweeps across on release

  const handlePressIn = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pressed.value = withSpring(1, { damping: 14, stiffness: 220 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 14, stiffness: 180 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    sweep.value = -1;
    sweep.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    onPress();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.96]) }],
    shadowOpacity: interpolate(pressed.value, [0, 1], [0.25, 0.6]),
    shadowRadius: interpolate(pressed.value, [0, 1], [8, 18]),
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sweep.value, [-1, -0.2, 0.2, 1], [0, 0.35, 0.35, 0]),
    transform: [{ translateX: interpolate(sweep.value, [-1, 1], [-160, 160]) }],
  }));

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : typeof children === 'string' ? (
        <Text style={[styles.text, { color: textColor }]}>{children}</Text>
      ) : (
        children
      )}
      <Animated.View pointerEvents="none" style={[styles.sweep, sweepStyle]} />
    </>
  );

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={style}
    >
      <Animated.View
        style={[
          styles.shadowWrap,
          { shadowColor: glowColor ?? gradient[0], opacity: disabled ? 0.5 : 1 },
          containerStyle,
        ]}
      >
        {variant === 'filled' ? (
          <AnimatedLinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.inner}
          >
            {content}
          </AnimatedLinearGradient>
        ) : (
          <View style={[styles.inner, styles.outlineInner]}>{content}</View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const Gradients_purpleToBlue = [Colors.accentPrimary, Colors.accentSecondary] as const;

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: BorderRadius.md,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  inner: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outlineInner: {
    borderWidth: 1,
    borderColor: Colors.textMuted + '60',
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: '#FFFFFF',
    transform: [{ skewX: '-20deg' }],
  },
});
