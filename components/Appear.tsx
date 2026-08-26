import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

export interface AppearProps {
  children: ReactNode;
  /** ms to wait before the entrance starts */
  delay?: number;
  /** ms the entrance takes */
  duration?: number;
  /** slide direction, or 'none' for a pure fade */
  from?: 'none' | 'up' | 'down';
  style?: StyleProp<ViewStyle>;
}

/**
 * One entrance-animation primitive for the whole app. Native uses
 * Reanimated's layout animations directly; the web build swaps in a
 * mount-state CSS transition (see Appear.web.tsx) because Reanimated's web
 * layout-animation path intermittently paints a stuck low-opacity first
 * frame that only clears on a subtree remount.
 */
export function Appear({ children, delay = 0, duration = 600, from = 'up', style }: AppearProps) {
  const entering =
    from === 'up'
      ? FadeInUp.delay(delay).duration(duration)
      : from === 'down'
        ? FadeInDown.delay(delay).duration(duration)
        : FadeIn.delay(delay).duration(duration);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
