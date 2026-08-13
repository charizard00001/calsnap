import { Colors } from '@/constants/theme';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming
} from 'react-native-reanimated';

interface SlashRevealProps {
  visible: boolean;
  onComplete?: () => void;
  children: React.ReactNode;
}

export default function SlashReveal({ visible, onComplete, children }: SlashRevealProps) {
  const slashOpacity = useSharedValue(0);
  const slashScale = useSharedValue(0.5);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  React.useEffect(() => {
    if (visible) {
      // Flash slash effect
      slashOpacity.value = withSequence(
        withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) }),
        withDelay(200, withTiming(0, { duration: 200 }))
      );
      slashScale.value = withSequence(
        withTiming(1.2, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 100 })
      );

      // Reveal content after slash
      contentOpacity.value = withDelay(
        350,
        withTiming(1, { duration: 300 })
      );
      contentTranslateY.value = withDelay(
        350,
        withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
      );

      if (onComplete) {
        const timeout = setTimeout(() => onComplete(), 700);
        return () => clearTimeout(timeout);
      }
    } else {
      slashOpacity.value = 0;
      contentOpacity.value = 0;
      contentTranslateY.value = 20;
    }
  }, [visible]);

  const slashStyle = useAnimatedStyle(() => ({
    opacity: slashOpacity.value,
    transform: [{ scale: slashScale.value }, { rotate: '-15deg' }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  if (!visible) return null;

  return (
    <>
      {/* Slash flash */}
      <Animated.View style={[styles.slash, slashStyle]} pointerEvents="none" />

      {/* Content */}
      <Animated.View style={contentStyle}>{children}</Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  slash: {
    position: 'absolute',
    width: '120%',
    height: 3,
    backgroundColor: Colors.gojoWhite,
    alignSelf: 'center',
    top: '50%',
    left: '-10%',
    shadowColor: Colors.jjkPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    zIndex: 10,
  },
});
