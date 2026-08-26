import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Appear } from '@/components/Appear';
import ParticleBackground from '@/components/ParticleBackground';
import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useGoals, useUpdateGoals } from '@/hooks/useGoals';
import { deleteAccount } from '@/lib/account';
import { confirmAction, notify } from '@/lib/confirm';
import { deleteAllMealsFromSupabase, deleteMealsForDate } from '@/lib/mealsRepository';
import { DEFAULT_GOALS } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { getTodayKey } from '@/utils/dateHelpers';
import { clearAllData, clearDailyLog } from '@/utils/storage';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { data: goals = DEFAULT_GOALS } = useGoals();
  const updateGoalsMutation = useUpdateGoals();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState(goals.name);
  const [calGoal, setCalGoal] = useState(String(goals.calorieGoal));
  const [proGoal, setProGoal] = useState(String(goals.proteinGoal));
  const [deletingAccount, setDeletingAccount] = useState(false);

  // useGoals() starts on placeholderData (DEFAULT_GOALS) and resolves the
  // real profile a beat later. On a cold load straight to this screen the
  // fields were initialised from the placeholder and never caught up — pull
  // the values in when the query settles, unless a field is mid-edit.
  const editing = useRef(false);
  useEffect(() => {
    if (editing.current) return;
    setName(goals.name);
    setCalGoal(String(goals.calorieGoal));
    setProGoal(String(goals.proteinGoal));
  }, [goals.name, goals.calorieGoal, goals.proteinGoal]);

  const saveName = () => {
    editing.current = false;
    if (name.trim()) {
      updateGoalsMutation.mutate({ name: name.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const saveCalGoal = () => {
    editing.current = false;
    const val = parseInt(calGoal, 10);
    if (val > 0) {
      updateGoalsMutation.mutate({ calorieGoal: val });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const saveProGoal = () => {
    editing.current = false;
    const val = parseInt(proGoal, 10);
    if (val > 0) {
      updateGoalsMutation.mutate({ proteinGoal: val });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleClearToday = async () => {
    const ok = await confirmAction(
      "Clear Today's Log",
      'This will remove all meals logged today. This cannot be undone.',
      'Clear'
    );
    if (!ok) return;

    const today = getTodayKey();
    await deleteMealsForDate(today);
    await clearDailyLog(today);
    queryClient.invalidateQueries({ queryKey: ['dailyLog', today] });
    queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const handleSignOut = async () => {
    const ok = await confirmAction(
      'Sign Out',
      'You can sign back in any time.',
      'Sign Out'
    );
    if (!ok) return;

    await supabase.auth.signOut();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const handleClearAll = async () => {
    const ok = await confirmAction(
      'Clear All Data',
      'This will permanently delete ALL meal logs and history, on this device and on your account. This cannot be undone.',
      'Delete Everything'
    );
    if (!ok) return;

    await deleteAllMealsFromSupabase();
    await clearAllData();
    queryClient.invalidateQueries();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleDeleteAccount = async () => {
    const ok = await confirmAction(
      'Delete Account',
      'This permanently deletes your account, every meal you\'ve logged, and all photos. This cannot be undone.',
      'Delete My Account'
    );
    if (!ok) return;

    setDeletingAccount(true);
    try {
      await deleteAccount();
      await clearAllData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await supabase.auth.signOut();
      router.replace('/auth');
    } catch (e) {
      notify('Deletion failed', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <View style={styles.container}>
      <ParticleBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Adjust your daily goals</Text>

        {/* Name */}
        <Appear>
          <SettingsRow label="Display Name" color={Colors.accentPrimary}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              onFocus={() => { editing.current = true; }}
              onBlur={saveName}
              placeholder="Enter name"
              placeholderTextColor={Colors.textMuted}
            />
          </SettingsRow>
        </Appear>

        {/* Calorie Goal */}
        <Appear delay={100}>
          <SettingsRow label="Daily Calorie Goal" color={Colors.accentWarm}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={calGoal}
                onChangeText={setCalGoal}
                onFocus={() => { editing.current = true; }}
                onBlur={saveCalGoal}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.inputUnit}>kcal</Text>
            </View>
          </SettingsRow>
        </Appear>

        {/* Protein Goal */}
        <Appear delay={200}>
          <SettingsRow label="Daily Protein Goal" color={Colors.accentHot}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={proGoal}
                onChangeText={setProGoal}
                onFocus={() => { editing.current = true; }}
                onBlur={saveProGoal}
                keyboardType="numeric"
                placeholder="150"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.inputUnit}>g</Text>
            </View>
          </SettingsRow>
        </Appear>

        {/* Danger Zone */}
        <Appear delay={400} style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>☠️ Danger Zone</Text>

          <Pressable onPress={handleSignOut} style={styles.dangerButton}>
            <View style={[styles.dangerBorder, { borderColor: Colors.accentSecondary }]} />
            <Text style={[styles.dangerButtonText, { color: Colors.accentSecondary }]}>Sign Out</Text>
            <Text style={styles.dangerButtonSub}>Your data stays safe on your account</Text>
          </Pressable>

          <Pressable onPress={handleClearToday} style={styles.dangerButton}>
            <View style={[styles.dangerBorder, { borderColor: Colors.accentWarm }]} />
            <Text style={styles.dangerButtonText}>Clear Today's Data</Text>
            <Text style={styles.dangerButtonSub}>Removes all meals logged today</Text>
          </Pressable>

          <Pressable onPress={handleClearAll} style={styles.dangerButton}>
            <View style={[styles.dangerBorder, { borderColor: Colors.accentHot }]} />
            <Text style={[styles.dangerButtonText, { color: Colors.accentHot }]}>
              Clear All History
            </Text>
            <Text style={styles.dangerButtonSub}>
              Permanently deletes everything
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            style={styles.dangerButton}
            disabled={deletingAccount}
          >
            <View style={[styles.dangerBorder, { borderColor: Colors.accentHot }]} />
            <Text style={[styles.dangerButtonText, { color: Colors.accentHot }]}>
              {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
            </Text>
            <Text style={styles.dangerButtonSub}>
              Deletes your account, all meals, and all photos for good
            </Text>
          </Pressable>
        </Appear>

        <View style={styles.legalRow}>
          <Link href="/privacy" style={styles.legalLink}>Privacy Policy</Link>
          <Text style={styles.legalDivider}>·</Text>
          <Link href="/terms" style={styles.legalLink}>Terms of Service</Link>
        </View>
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
    color: Colors.accentHot,
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
    color: Colors.accentWarm,
  },
  dangerButtonSub: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  legalLink: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  legalDivider: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});
