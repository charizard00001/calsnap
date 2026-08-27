import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import StickerPressable from '@/components/ui/StickerPressable';
import { AI_MODELS } from '@/constants/aiModels';
import { Colors, Fonts } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

const TINT = [Colors.accentLime, Colors.accentGold, Colors.accentCool];

interface ModelPickerProps {
  value: string;
  onChange: (id: string) => void;
}

/** The engine list, shared by onboarding and Profile so they can't drift. */
export default function ModelPicker({ value, onChange }: ModelPickerProps) {
  return (
    <View style={styles.list}>
      {AI_MODELS.map((m, i) => {
        const selected = m.id === value;
        return (
          <StickerPressable
            key={m.id}
            color={selected ? TINT[i % TINT.length] : Colors.cardBg}
            borderColor={selected ? Colors.ink : Colors.hairline}
            radius={18}
            shadow={selected ? 5 : 0}
            sound="tap"
            onPress={() => onChange(m.id)}
            contentStyle={styles.row}
            accessibilityLabel={`${m.label}${selected ? ', selected' : ''}`}
          >
            <View style={styles.tick}>
              {selected ? (
                <Icon name="check" size={20} color={Colors.ink} strokeWidth={3.2} />
              ) : (
                <View style={styles.emptyTick} />
              )}
            </View>

            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={[styles.label, !selected && styles.labelIdle]}>{m.label}</Text>
                {m.recommended && (
                  <Chip
                    label="RECOMMENDED"
                    color={selected ? Colors.ink : Colors.accentLime}
                    textColor={selected ? Colors.accentLime : Colors.ink}
                    size="sm"
                  />
                )}
              </View>
              <Text style={[styles.blurb, !selected && styles.blurbIdle]}>{m.blurb}</Text>
            </View>

            <Text style={[styles.speed, !selected && styles.speedIdle]}>{m.speed}</Text>
          </StickerPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    minHeight: 64,
  },
  tick: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emptyTick: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: Colors.textMuted,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: Colors.ink,
  },
  labelIdle: {
    color: Colors.paper,
  },
  blurb: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    lineHeight: 14,
    color: Colors.ink,
    opacity: 0.72,
  },
  blurbIdle: {
    color: Colors.textSecondary,
    opacity: 1,
  },
  speed: {
    fontFamily: Fonts.display,
    fontSize: 11,
    color: Colors.ink,
    flexShrink: 0,
  },
  speedIdle: {
    color: Colors.textMuted,
  },
});
