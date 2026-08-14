import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import ParticleBackground from '@/components/ParticleBackground';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { syncProfileGoals } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useMealStore } from '@/store/useMealStore';

export default function SettingsScreen() {
  const { goals, updateGoals, clearToday, clearAll, loadToday } = useMealStore();
  const [name, setName] = useState(goals.name);
  const [calGoal, setCalGoal] = useState(String(goals.calorieGoal));
  const [proGoal, setProGoal] = useState(String(goals.proteinGoal));

  const saveName = () => {
    if (name.trim()) {
      updateGoals({ name: name.trim() });
      syncProfileGoals({ ...goals, name: name.trim() }).catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const saveCalGoal = () => {
    const val = parseInt(calGoal, 10);
    if (val > 0) {
      updateGoals({ calorieGoal: val });
      syncProfileGoals({ ...goals, calorieGoal: val }).catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const saveProGoal = () => {
    const val = parseInt(proGoal, 10);
    if (val > 0) {
      updateGoals({ proteinGoal: val });
      syncProfileGoals({ ...goals, proteinGoal: val }).catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleClearToday = () => {
    Alert.alert(
      'Clear Today\'s Log',
      'This will remove all meals logged today. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearToday();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL meal logs, goals, and history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ParticleBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Sorcerer Profile</Text>
        <Text style={styles.subtitle}>Adjust your training parameters</Text>

        {/* Name */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <SettingsRow label="Sorcerer Name" color={Colors.jjkPurple}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              onBlur={saveName}
              placeholder="Enter name"
              placeholderTextColor={Colors.textMuted}
            />
          </SettingsRow>
        </Animated.View>

        {/* Calorie Goal */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)}>
          <SettingsRow label="Daily Cursed Energy Limit" color={Colors.demonOrange}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={calGoal}
                onChangeText={setCalGoal}
                onBlur={saveCalGoal}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.inputUnit}>kcal</Text>
            </View>
          </SettingsRow>
        </Animated.View>

        {/* Protein Goal */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <SettingsRow label="Strength Absorption Target" color={Colors.demonRed}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={proGoal}
                onChangeText={setProGoal}
                onBlur={saveProGoal}
                keyboardType="numeric"
                placeholder="150"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.inputUnit}>g</Text>
            </View>
          </SettingsRow>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>☠️ Danger Zone</Text>

          <Pressable onPress={handleSignOut} style={styles.dangerButton}>
            <View style={[styles.dangerBorder, { borderColor: Colors.jjkBlue }]} />
            <Text style={[styles.dangerButtonText, { color: Colors.jjkBlue }]}>Sign Out</Text>
            <Text style={styles.dangerButtonSub}>Your data stays safe on your account</Text>
          </Pressable>

          <Pressable onPress={handleClearToday} style={styles.dangerButton}>
            <View style={[styles.dangerBorder, { borderColor: Colors.demonOrange }]} />
            <Text style={styles.dangerButtonText}>Clear Today's Data</Text>
            <Text style={styles.dangerButtonSub}>Removes all meals logged today</Text>
          </Pressable>

          <Pressable onPress={handleClearAll} style={styles.dangerButton}>
            <View style={[styles.dangerBorder, { borderColor: Colors.demonRed }]} />
            <Text style={[styles.dangerButtonText, { color: Colors.demonRed }]}>
              Clear All History
            </Text>
            <Text style={styles.dangerButtonSub}>
              Permanently deletes everything
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function SettingsRow({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowBorder, { backgroundColor: color }]} />
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  rowBorder: {
    width: 3,
  },
  rowContent: {
    flex: 1,
    padding: Spacing.md,
  },
  rowLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    fontWeight: '700',
    padding: 0,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputUnit: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  dangerZone: {
    marginTop: Spacing.xl,
  },
  dangerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.demonRed,
    marginBottom: Spacing.md,
  },
  dangerButton: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    paddingLeft: Spacing.md + 3,
    marginBottom: Spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  dangerBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  dangerButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.demonOrange,
  },
  dangerButtonSub: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
