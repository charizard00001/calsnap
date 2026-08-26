import { Colors, Sticker as S } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { sfx, type SfxName } from '@/lib/sfx';

interface StickerPressableProps {
  onPress?: () => void;
  children?: ReactNode;
  color?: string;
  shadow?: number;
  radius?: number;
  border?: number;
  borderColor?: string;
  rotate?: number;
  disabled?: boolean;
  /** Which synthesised sound to play on press. `null` for silence. */
  sound?: SfxName | null;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * A Sticker you can press. On press the face slides into its own shadow by
 * exactly the shadow offset and the shadow fades — the whole tactile
 * language of the app in one gesture.
 */
export default function StickerPressable({
  onPress,
  children,
  color = Colors.paper,
  shadow = S.shadow,
  radius = S.radius,
  border = S.border,
  borderColor = Colors.ink,
  rotate = 0,
  disabled = false,
  sound = 'tap',
  style,
  contentStyle,
  accessibilityLabel,
}: StickerPressableProps) {
  const held = useSharedValue(0);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: held.value * shadow }, { translateY: held.value * shadow }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 1 - held.value,
  }));

  const press = (to: number) => {
    held.value = withTiming(to, { duration: 80 });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // The whole sticker is the hit target; children never intercept. This
      // replaces wrapping them in a pointerEvents="none" View, which would
      // insert an extra layout box and break the row/column layout callers
      // set through contentStyle.
      pointerEvents="box-only"
      disabled={disabled}
      onPressIn={() => {
        if (disabled) return;
        press(1);
      }}
      onPressOut={() => press(0)}
      onPress={() => {
        if (disabled) return;
        if (sound) sfx(sound);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
      }}
      style={[
        styles.wrap,
        rotate ? { transform: [{ rotate: `${rotate}deg` }] } : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {shadow > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shadow,
            {
              borderRadius: radius,
              left: shadow,
              top: shadow,
              right: -shadow,
              bottom: -shadow,
            },
            shadowStyle,
          ]}
        />
      )}
      <Animated.View
        style={[
          {
            backgroundColor: color,
            borderRadius: radius,
            borderWidth: border,
            borderColor,
          },
          contentStyle,
          faceStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    backgroundColor: Colors.ink,
  },
  disabled: {
    opacity: 0.5,
  },
});
