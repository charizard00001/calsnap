import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArcadeBg from '@/components/ui/ArcadeBg';
import Confetti from '@/components/ui/Confetti';
import Icon from '@/components/ui/Icon';
import Marquee from '@/components/ui/Marquee';
import Snappy from '@/components/ui/Snappy';
import Sticker from '@/components/ui/Sticker';
import StickerPressable from '@/components/ui/StickerPressable';
import { Colors, Fonts } from '@/constants/theme';
import { completeOnboarding } from '@/lib/profile';
import { sfx } from '@/lib/sfx';
import { supabase } from '@/lib/supabase';
import type { UserGoals } from '@/types';
import { saveUserGoals, setOnboardingComplete } from '@/utils/storage';
import { useOnboardingContext } from './_layout';

const STEPS = 5;
const CAL_PRESETS = [1600, 2000, 2400];
const PRO_PRESETS = [110, 150, 190];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { markOnboarded } = useOnboardingContext();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(150);
  const [burst, setBurst] = useState(0);

  const next = () => {
    sfx('up');
    setStep((s) => Math.min(s + 1, STEPS - 1));
  };

  const handleComplete = async () => {
    setBurst((n) => n + 1);
    sfx('fanfare');

    const goals: UserGoals = {
      name: name.trim() || 'Friend',
      calorieGoal,
      proteinGoal,
      installDate: new Date().toISOString(),
    };

    await saveUserGoals(goals);
    queryClient.setQueryData(['goals'], goals);

    const { data } = await supabase.auth.getUser();
    if (data.user) await setOnboardingComplete(data.user.id);
    await completeOnboarding(goals).catch(() => {});

    // Signal to root layout that onboarding is done — it handles navigation.
    markOnboarded();
  };

  return (
    <View style={styles.container}>
      <ArcadeBg glows={[Colors.accentWarm, Colors.accentSecondary]} />

      <View style={{ height: insets.top }} />

      <View style={styles.dotsRow}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step && styles.dotActive,
              i < step && styles.dotDone,
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <View style={styles.stepBlock}>
              <Snappy size={112} mood="ready" />
              <Text style={styles.headline}>LET&apos;S GET{'\n'}YOU SET UP</Text>
              <Text style={styles.sub}>Four quick questions. Then you eat.</Text>
              <PrimaryButton label="BEGIN" onPress={next} />
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepBlock}>
              <Text style={styles.headline}>WHAT DO WE{'\n'}CALL YOU?</Text>
              <Text style={styles.sub}>Shows up on your dashboard. Optional.</Text>
              <Sticker color={Colors.paper} radius={22} shadow={6} border={4} contentStyle={styles.card}>
                <TextInput
                  style={styles.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={Colors.ink + '55'}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={next}
                />
              </Sticker>
              <PrimaryButton label="CONTINUE" onPress={next} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepBlock}>
              <Text style={styles.headline}>HOW MANY{'\n'}CALORIES?</Text>
              <Text style={styles.sub}>Rough is fine. Change it any time.</Text>
              <NumberDial
                value={calorieGoal}
                unit="KCAL"
                step={50}
                min={800}
                presets={CAL_PRESETS}
                onChange={setCalorieGoal}
              />
              <PrimaryButton label="CONTINUE" onPress={next} />
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepBlock}>
              <Text style={styles.headline}>AND HOW MUCH{'\n'}PROTEIN?</Text>
              <Text style={styles.sub}>Grams per day you want to hit.</Text>
              <NumberDial
                value={proteinGoal}
                unit="GRAMS"
                step={5}
                min={20}
                presets={PRO_PRESETS}
                onChange={setProteinGoal}
              />
              <PrimaryButton label="CONTINUE" onPress={next} />
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepBlock}>
              <View style={styles.readyWrap}>
                <Confetti trigger={burst} count={18} spread={95} />
                <Snappy size={118} mood="streak" />
              </View>
              <Text style={styles.headline}>YOU&apos;RE ALL{'\n'}SET!</Text>
              <View style={styles.summaryRow}>
                <Sticker color={Colors.accentGold} radius={14} shadow={4} contentStyle={styles.summaryChip}>
                  <Text style={styles.summaryValue}>{calorieGoal}</Text>
                  <Text style={styles.summaryLabel}>KCAL</Text>
                </Sticker>
                <Sticker color={Colors.accentPrimary} radius={14} shadow={4} contentStyle={styles.summaryChip}>
                  <Text style={styles.summaryValue}>{proteinGoal}g</Text>
                  <Text style={styles.summaryLabel}>PROTEIN</Text>
                </Sticker>
              </View>
              <PrimaryButton label="START SNAPPING" onPress={handleComplete} color={Colors.accentLime} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Marquee
        text={`STEP ${step + 1} OF ${STEPS} ★ ALMOST EATING`}
        color={Colors.accentGold}
        duration={14}
        height={34}
        style={{ marginBottom: insets.bottom }}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  color = Colors.accentWarm,
}: {
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <StickerPressable
      color={color}
      radius={20}
      shadow={6}
      border={4}
      sound={null}
      onPress={onPress}
      style={styles.ctaWrap}
      contentStyle={styles.cta}
    >
      <Text style={styles.ctaText}>{label}</Text>
      <Icon name="forward" size={22} color={Colors.ink} strokeWidth={3.2} />
    </StickerPressable>
  );
}

function NumberDial({
  value,
  unit,
  step,
  min,
  presets,
  onChange,
}: {
  value: number;
  unit: string;
  step: number;
  min: number;
  presets: number[];
  onChange: (v: number) => void;
}) {
  return (
    <Sticker color={Colors.paper} radius={26} shadow={7} border={4} contentStyle={styles.dial}>
      <View style={styles.dialValueRow}>
        <Text style={styles.dialValue}>{value}</Text>
        <Text style={styles.dialUnit}>{unit}</Text>
      </View>

      <View style={styles.dialControls}>
        <StickerPressable
          color={Colors.accentCool}
          radius={18}
          shadow={4}
          border={4}
          sound="down"
          onPress={() => onChange(Math.max(min, value - step))}
          contentStyle={styles.dialBtn}
          accessibilityLabel="Decrease"
        >
          <Icon name="minus" size={22} color={Colors.ink} strokeWidth={3.6} />
        </StickerPressable>
        <Text style={styles.dialStep}>STEP {step}</Text>
        <StickerPressable
          color={Colors.accentLime}
          radius={18}
          shadow={4}
          border={4}
          sound="up"
          onPress={() => onChange(value + step)}
          contentStyle={styles.dialBtn}
          accessibilityLabel="Increase"
        >
          <Icon name="plus" size={22} color={Colors.ink} strokeWidth={3.6} />
        </StickerPressable>
      </View>

      <View style={styles.presetRow}>
        {presets.map((p) => (
          <StickerPressable
            key={p}
            color={value === p ? Colors.accentGold : Colors.paperDim}
            radius={999}
            shadow={value === p ? 3 : 0}
            onPress={() => onChange(p)}
            contentStyle={styles.preset}
          >
            <Text style={styles.presetText}>{p}</Text>
          </StickerPressable>
        ))}
      </View>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  flex: {
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 22,
    paddingBottom: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: Colors.ink,
    backgroundColor: Colors.hairline,
  },
  dotActive: {
    width: 34,
    backgroundColor: Colors.accentWarm,
  },
  dotDone: {
    backgroundColor: Colors.paper,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  stepBlock: {
    alignItems: 'center',
    gap: 18,
  },
  headline: {
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: Colors.paper,
    textAlign: 'center',
  },
  sub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 270,
    marginTop: -10,
  },
  card: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  nameInput: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.ink,
    textAlign: 'center',
    paddingVertical: 12,
    minHeight: 56,
  },
  dial: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  dialValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  dialValue: {
    fontFamily: Fonts.display,
    fontSize: 52,
    lineHeight: 58,
    color: Colors.ink,
  },
  dialUnit: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.accentWarm,
  },
  dialControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dialBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialStep: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.textMuted,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  preset: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontFamily: Fonts.display,
    fontSize: 11,
    color: Colors.ink,
  },
  readyWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 11,
  },
  summaryChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: Fonts.display,
    fontSize: 19,
    color: Colors.ink,
  },
  summaryLabel: {
    fontFamily: Fonts.display,
    fontSize: 8,
    color: Colors.ink,
  },
  ctaWrap: {
    width: '100%',
    marginTop: 4,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 60,
  },
  ctaText: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.ink,
  },
});
