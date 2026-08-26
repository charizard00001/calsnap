import Chip from '@/components/ui/Chip';
import Icon, { type IconName } from '@/components/ui/Icon';
import Snappy from '@/components/ui/Snappy';
import Sticker from '@/components/ui/Sticker';
import StickerPressable from '@/components/ui/StickerPressable';
import { Colors, Fonts } from '@/constants/theme';
import type { NutritionResult } from '@/types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface NutritionResultCardProps {
  result: NutritionResult;
  onUpdate: (updated: NutritionResult) => void;
}

const CONFIDENCE_COPY: Record<string, { label: string; color: string }> = {
  high: { label: 'PRETTY SURE', color: Colors.accentLime },
  medium: { label: 'FAIRLY SURE', color: Colors.accentGold },
  low: { label: 'BEST GUESS', color: Colors.accentWarm },
};

export default function NutritionResultCard({
  result,
  onUpdate,
}: NutritionResultCardProps) {
  const conf = CONFIDENCE_COPY[result.confidence] ?? CONFIDENCE_COPY.low;

  const bump = (field: 'protein' | 'carbs' | 'fat', delta: number) => {
    const next = Math.max(0, result[field] + delta);
    const updated = { ...result, [field]: next };
    // Calories are derived from the macros, so they stay honest while the
    // user corrects the AI rather than drifting out of sync with them.
    updated.calories = updated.protein * 4 + updated.carbs * 4 + updated.fat * 9;
    onUpdate(updated);
  };

  return (
    <View style={styles.wrap}>
      <Sticker color={Colors.paper} radius={24} shadow={7} border={4} contentStyle={styles.card}>
        <View style={styles.headRow}>
          <View style={styles.thumb}>
            <Icon name="plate" size={30} color={Colors.ink} strokeWidth={2.4} />
          </View>
          <View style={styles.headText}>
            <Text style={styles.foodName}>{result.foodName.toUpperCase()}</Text>
            {!!result.description && (
              <Text style={styles.description} numberOfLines={3}>
                {result.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.kcalRow}>
          <Text style={styles.kcal}>{result.calories}</Text>
          <Text style={styles.kcalUnit}>KCAL</Text>
          <View style={styles.kcalSpacer} />
          <Chip label={(result.servingSize || 'ONE SERVING').toUpperCase()} color={Colors.accentGold} />
        </View>
      </Sticker>

      <View style={styles.confidenceWrap}>
        <Chip label={conf.label} color={conf.color} />
      </View>

      <View style={styles.macroList}>
        <MacroStepper
          label="PROTEIN"
          hint="keeps you full"
          initial="P"
          icon="protein"
          color={Colors.accentPrimary}
          value={result.protein}
          onChange={(d) => bump('protein', d)}
        />
        <MacroStepper
          label="CARBS"
          hint="the rice and roti"
          initial="C"
          icon="carbs"
          color={Colors.accentGold}
          value={result.carbs}
          onChange={(d) => bump('carbs', d)}
        />
        <MacroStepper
          label="FAT"
          hint="oil, ghee, gravy"
          initial="F"
          icon="fat"
          color={Colors.accentCool}
          value={result.fat}
          onChange={(d) => bump('fat', d)}
        />
      </View>

      <View style={styles.snappyRow}>
        <Snappy size={44} mood="thinking" />
        <View style={styles.snappyCopy}>
          <Text style={styles.snappyTitle}>SNAPPY&apos;S TAKE</Text>
          <Text style={styles.snappyBody}>
            Numbers off? Nudge them — calories update as you go.
          </Text>
        </View>
      </View>
    </View>
  );
}

function MacroStepper({
  label,
  hint,
  initial,
  icon,
  color,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  initial: string;
  icon: IconName;
  color: string;
  value: number;
  onChange: (delta: number) => void;
}) {
  return (
    <Sticker color={color} radius={18} shadow={5} contentStyle={styles.macroCard}>
      <View style={styles.macroLeft}>
        <View style={styles.macroBadge}>
          <Text style={[styles.macroInitial, { color }]}>{initial}</Text>
        </View>
        <View style={styles.macroLabels}>
          <Text style={styles.macroLabel}>{label}</Text>
          <Text style={styles.macroHint}>{hint}</Text>
        </View>
      </View>

      <View style={styles.stepperRow}>
        <StickerPressable
          color={Colors.ink}
          radius={12}
          shadow={0}
          sound="down"
          onPress={() => onChange(-1)}
          contentStyle={styles.stepBtn}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Icon name="minus" size={18} color={Colors.paper} strokeWidth={3.4} />
        </StickerPressable>

        <Text style={styles.macroValue}>
          {value}
          <Text style={styles.macroValueUnit}>g</Text>
        </Text>

        <StickerPressable
          color={Colors.ink}
          radius={12}
          shadow={0}
          sound="up"
          onPress={() => onChange(1)}
          contentStyle={styles.stepBtn}
          accessibilityLabel={`Increase ${label}`}
        >
          <Icon name="plus" size={18} color={Colors.paper} strokeWidth={3.4} />
        </StickerPressable>
      </View>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  card: {
    padding: 16,
    gap: 12,
  },
  headRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumb: {
    width: 62,
    height: 62,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.ink,
    backgroundColor: Colors.accentWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
    gap: 4,
  },
  foodName: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 21,
    color: Colors.ink,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 3,
    borderStyle: 'dashed',
    borderColor: Colors.ink,
    paddingTop: 12,
  },
  kcal: {
    fontFamily: Fonts.display,
    fontSize: 40,
    lineHeight: 44,
    color: Colors.ink,
  },
  kcalUnit: {
    fontFamily: Fonts.display,
    fontSize: 14,
    color: Colors.accentPrimary,
  },
  kcalSpacer: {
    flex: 1,
  },
  confidenceWrap: {
    alignItems: 'flex-start',
  },
  macroList: {
    gap: 10,
  },
  macroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  macroLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: Colors.ink,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroInitial: {
    fontFamily: Fonts.display,
    fontSize: 13,
  },
  macroLabels: {
    flex: 1,
  },
  macroLabel: {
    fontFamily: Fonts.display,
    fontSize: 12,
    color: Colors.ink,
  },
  macroHint: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.ink,
    opacity: 0.65,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroValue: {
    fontFamily: Fonts.display,
    fontSize: 19,
    color: Colors.ink,
    minWidth: 54,
    textAlign: 'center',
  },
  macroValueUnit: {
    fontSize: 11,
  },
  snappyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: Colors.accentViolet,
    padding: 13,
  },
  snappyCopy: {
    flex: 1,
    gap: 2,
  },
  snappyTitle: {
    fontFamily: Fonts.display,
    fontSize: 11,
    color: Colors.accentViolet,
  },
  snappyBody: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.paper,
  },
});
