import { Colors, Sticker as S } from '@/constants/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

interface StickerProps {
  children?: ReactNode;
  /** Fill colour of the sticker face. */
  color?: string;
  /** Offset of the hard ink shadow. 0 removes it. */
  shadow?: number;
  radius?: number;
  border?: number;
  borderColor?: string;
  /** Degrees of tilt — keep it small, ±1–3. */
  rotate?: number;
  style?: ViewStyle;
  /** Applied to the sticker face rather than the outer wrapper. */
  contentStyle?: ViewStyle;
}

/**
 * The one surface primitive: an ink outline, a flat fill, and a hard offset
 * shadow drawn as an actual layer behind the face rather than a blur. RN's
 * shadow props render differently on iOS, Android and web and can't do a
 * zero-blur offset consistently, so the shadow here is just another View.
 */
export default function Sticker({
  children,
  color = Colors.paper,
  shadow = S.shadow,
  radius = S.radius,
  border = S.border,
  borderColor = Colors.ink,
  rotate = 0,
  style,
  contentStyle,
}: StickerProps) {
  return (
    <View
      style={[
        styles.wrap,
        rotate ? { transform: [{ rotate: `${rotate}deg` }] } : null,
        style,
      ]}
    >
      {shadow > 0 && (
        <View
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
          ]}
        />
      )}
      <View
        style={[
          {
            backgroundColor: color,
            borderRadius: radius,
            borderWidth: border,
            borderColor,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
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
});
