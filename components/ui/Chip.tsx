import { Colors, Fonts } from '@/constants/theme';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

interface ChipProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

/** The small outlined pill used for macros, meal types and status flags. */
export default function Chip({
  label,
  color = Colors.accentGold,
  textColor = Colors.ink,
  size = 'md',
  style,
}: ChipProps) {
  const small = size === 'sm';
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: color,
          borderWidth: small ? 2 : 3,
          paddingHorizontal: small ? 7 : 10,
          paddingVertical: small ? 1 : 3,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor, fontSize: small ? 8 : 10 }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderColor: Colors.ink,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Fonts.display,
    letterSpacing: 0.3,
  },
});
