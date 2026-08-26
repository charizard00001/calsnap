import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { AppearProps } from './Appear';

const OFFSET = 16;

/**
 * Web entrance animation. Reanimated's web layout-animation path
 * (`entering={FadeInUp…}`) intermittently paints a stuck low-opacity first
 * frame that never clears until the subtree remounts — observed repeatedly
 * across the auth, dashboard, and settings screens. Here the same
 * fade/slide is driven off real mount state through a plain CSS transition,
 * so it's deterministic and involves no worklet.
 *
 * Once shown, `shown` stays true for the life of the component instance, so
 * a parent re-render (e.g. FlashList re-rendering its header) never replays
 * the animation.
 */
export function Appear({ children, delay = 0, duration = 600, from = 'up', style }: AppearProps) {
  const [shown, setShown] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const id = setTimeout(() => {
      if (mounted.current) setShown(true);
    }, delay + 20);
    return () => {
      mounted.current = false;
      clearTimeout(id);
    };
  }, [delay]);

  const translateY = from === 'up' ? OFFSET : from === 'down' ? -OFFSET : 0;

  return (
    <View
      style={[
        style,
        {
          opacity: shown ? 1 : 0,
          transform: [{ translateY: shown ? 0 : translateY }],
          // react-native-web passes these through to CSS; not in RN's types.
          transitionProperty: 'opacity, transform',
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        } as object,
      ]}
    >
      {children}
    </View>
  );
}
