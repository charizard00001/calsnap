import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import CrazyButton from '@/components/CrazyButton';
import ParticleBackground from '@/components/ParticleBackground';
import { BorderRadius, Colors, FontSizes, Gradients, Spacing } from '@/constants/theme';
import { completeOnboarding } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import type { UserGoals } from '@/types';
import { saveUserGoals, setOnboardingComplete } from '@/utils/storage';
import { useQueryClient } from '@tanstack/react-query';
import { useOnboardingContext } from './_layout';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { markOnboarded } = useOnboardingContext();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [proteinGoal, setProteinGoal] = useState('150');

  // Glow animation for the final step
  const glowScale = useSharedValue(1);
  React.useEffect(() => {
    if (step === 4) {
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [step]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s + 1);
  };

  const handleComplete = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const goals: UserGoals = {
      name: name.trim() || 'Friend',
      calorieGoal: parseInt(calorieGoal, 10) || 2000,
      proteinGoal: parseInt(proteinGoal, 10) || 150,
      installDate: new Date().toISOString(),
    };

    await saveUserGoals(goals);
    queryClient.setQueryData(['goals'], goals);

    const { data } = await supabase.auth.getUser();
    if (data.user) await setOnboardingComplete(data.user.id);
    await completeOnboarding(goals).catch(() => {});

    // Signal to root layout that onboarding is done — it will handle navigation
    markOnboarded();
  };

  const steps = [
    // Step 0: Welcome
    <Animated.View key="welcome" entering={FadeIn.duration(1000)} style={styles.stepContainer}>
      <Text style={styles.welcomeText}>Let's get{'\n'}you set up</Text>
      <CrazyButton onPress={handleNext} gradient={Gradients.purpleToBlue} style={styles.nextBtn}>
        Begin
      </CrazyButton>
    </Animated.View>,

    // Step 1: Name
    <Animated.View key="name" entering={FadeInUp.duration(600)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your name?</Text>
      <Text style={styles.stepSubtitle}>So we know what to call you</Text>
      <TextInput
        style={styles.stepInput}
        value={name}
        onChangeText={setName}
        placeholder="(optional)"
        placeholderTextColor={Colors.textMuted}
        autoFocus
      />
      <CrazyButton onPress={handleNext} gradient={Gradients.purpleToBlue} style={styles.nextBtn}>
        Continue
      </CrazyButton>
    </Animated.View>,

    // Step 2: Calorie Goal
    <Animated.View key="calories" entering={FadeInUp.duration(600)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Daily calorie goal</Text>
      <Text style={styles.stepSubtitle}>How many calories per day?</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.stepInputNumber}
          value={calorieGoal}
          onChangeText={setCalorieGoal}
          keyboardType="numeric"
          autoFocus
        />
        <Text style={styles.inputUnit}>kcal</Text>
      </View>
      <CrazyButton onPress={handleNext} gradient={Gradients.purpleToBlue} style={styles.nextBtn}>
        Continue
      </CrazyButton>
    </Animated.View>,

    // Step 3: Protein Goal
    <Animated.View key="protein" entering={FadeInUp.duration(600)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Daily protein goal</Text>
      <Text style={styles.stepSubtitle}>How much protein per day?</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.stepInputNumber}
          value={proteinGoal}
          onChangeText={setProteinGoal}
          keyboardType="numeric"
          autoFocus
        />
        <Text style={styles.inputUnit}>g</Text>
      </View>
      <CrazyButton onPress={handleNext} gradient={Gradients.purpleToBlue} style={styles.nextBtn}>
        Continue
      </CrazyButton>
    </Animated.View>,

    // Step 4: Ready
    <Animated.View key="ready" entering={FadeIn.duration(1000)} style={styles.stepContainer}>
      <Animated.View style={[styles.readyGlow, glowStyle]}>
        <LinearGradient
          colors={[Colors.accentPrimary + '40', Colors.accentSecondary + '20', 'transparent']}
          style={styles.readyGlowGradient}
        />
      </Animated.View>
      <Text style={styles.readyText}>You're all{'\n'}set!</Text>
      <CrazyButton onPress={handleComplete} gradient={Gradients.purpleToRed} style={styles.nextBtn}>
        Let's go ⚡
      </CrazyButton>
    </Animated.View>,
  ];

  return (
    <View style={styles.container}>
      <ParticleBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3, 4].map((i) => (
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

        {steps[step]}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 70,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted + '40',
  },
  dotActive: {
    backgroundColor: Colors.accentPrimary,
    width: 24,
  },
  dotDone: {
    backgroundColor: Colors.accentPrimary + '60',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  welcomeText: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: Spacing.xxl,
  },
  stepTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  stepInput: {
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentPrimary,
    paddingVertical: Spacing.sm,
    width: width * 0.6,
    marginBottom: Spacing.xxl,
  },
  stepInputNumber: {
    fontSize: FontSizes.display,
    color: Colors.textPrimary,
    fontWeight: '900',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentPrimary,
    paddingVertical: Spacing.sm,
    minWidth: 120,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  inputUnit: {
    fontSize: FontSizes.xl,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  nextBtn: {
    width: width * 0.7,
  },
  readyGlow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: Spacing.xl,
  },
  readyGlowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  readyText: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: Spacing.xxl,
  },
});
