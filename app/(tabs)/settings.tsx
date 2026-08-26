import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import ArcadeBg from '@/components/ui/ArcadeBg';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import Marquee from '@/components/ui/Marquee';
import Snappy from '@/components/ui/Snappy';
import Sticker from '@/components/ui/Sticker';
import StickerPressable from '@/components/ui/StickerPressable';
import { Colors, Fonts } from '@/constants/theme';
import { useGoals, useUpdateGoals } from '@/hooks/useGoals';
import { deleteAccount } from '@/lib/account';
import { confirmAction, notify } from '@/lib/confirm';
import { deleteAllMealsFromSupabase, deleteMealsForDate } from '@/lib/mealsRepository';
import { DEFAULT_GOALS } from '@/lib/profile';
import { isMuted, setMuted, sfx } from '@/lib/sfx';
import { supabase } from '@/lib/supabase';
import { getTodayKey } from '@/utils/dateHelpers';
import { clearAllData, clearDailyLog } from '@/utils/storage';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { data: goals = DEFAULT_GOALS } = useGoals();
  const updateGoalsMutation = useUpdateGoals();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState(goals.name);
  const [calGoal, setCalGoal] = useState(String(goals.calorieGoal));
  const [proGoal, setProGoal] = useState(String(goals.proteinGoal));
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [soundOn, setSoundOn] = useState(!isMuted());

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
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      sfx('up');
    }
  };

  const saveCalGoal = () => {
    editing.current = false;
    const val = parseInt(calGoal, 10);
    if (val > 0) {
      updateGoalsMutation.mutate({ calorieGoal: val });
      sfx('up');
    }
  };

  const saveProGoal = () => {
    editing.current = false;
    const val = parseInt(proGoal, 10);
    if (val > 0) {
      updateGoalsMutation.mutate({ proteinGoal: val });
      sfx('up');
    }
  };

  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    await setMuted(!next);
    if (next) sfx('chime');
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
    sfx('down');
  };

  const handleSignOut = async () => {
    const ok = await confirmAction('Sign Out', 'You can sign back in any time.', 'Sign Out');
    if (!ok) return;
    await supabase.auth.signOut();
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
    sfx('error');
  };

  const handleDeleteAccount = async () => {
    const ok = await confirmAction(
      'Delete Account',
      "This permanently deletes your account, every meal you've logged, and all photos. This cannot be undone.",
      'Delete My Account'
    );
    if (!ok) return;

    setDeletingAccount(true);
    try {
      await deleteAccount();
      await clearAllData();
      sfx('error');
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
      <ArcadeBg glows={[Colors.accentViolet, Colors.accentHot]} />

      <View style={{ height: insets.top }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Sticker color={Colors.accentViolet} radius={22} shadow={5} border={4} contentStyle={styles.avatar}>
            <Snappy size={46} color={Colors.paper} />
          </Sticker>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {goals.name.toUpperCase()}
            </Text>
            <View style={styles.headerChips}>
              <Chip label={`${goals.calorieGoal} KCAL`} color={Colors.accentLime} size="sm" />
              <Chip label={`${goals.proteinGoal}G PROTEIN`} color={Colors.accentCool} size="sm" />
            </View>
          </View>
        </View>

        <SectionTitle label="YOUR TARGETS" color={Colors.accentViolet} />

        <Sticker color={Colors.accentGold} radius={18} shadow={5} contentStyle={styles.field}>
          <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            onFocus={() => {
              editing.current = true;
            }}
            onBlur={saveName}
            placeholder="Enter name"
            placeholderTextColor={Colors.ink + '66'}
          />
        </Sticker>

        <Sticker color={Colors.accentSecondary} radius={18} shadow={5} contentStyle={styles.field}>
          <Text style={styles.fieldLabel}>DAILY CALORIES</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={calGoal}
              onChangeText={setCalGoal}
              onFocus={() => {
                editing.current = true;
              }}
              onBlur={saveCalGoal}
              keyboardType="numeric"
              placeholder="2000"
              placeholderTextColor={Colors.ink + '66'}
            />
            <Text style={styles.unit}>kcal</Text>
          </View>
        </Sticker>

        <Sticker color={Colors.accentPrimary} radius={18} shadow={5} contentStyle={styles.field}>
          <Text style={styles.fieldLabel}>DAILY PROTEIN</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={proGoal}
              onChangeText={setProGoal}
              onFocus={() => {
                editing.current = true;
              }}
              onBlur={saveProGoal}
              keyboardType="numeric"
              placeholder="150"
              placeholderTextColor={Colors.ink + '66'}
            />
            <Text style={styles.unit}>g</Text>
          </View>
        </Sticker>

        <View style={styles.soundRow}>
          <View style={styles.soundText}>
            <Text style={styles.soundTitle}>SOUND FX</Text>
            <Text style={styles.soundSub}>Boings, crunches, streak fanfare</Text>
          </View>
          <SoundToggle on={soundOn} onToggle={toggleSound} />
        </View>

        <SectionTitle label="DANGER ZONE" color={Colors.accentHot} />

        <StickerPressable
          color={Colors.cardBg}
          borderColor={Colors.accentSecondary}
          radius={16}
          shadow={0}
          onPress={handleSignOut}
          contentStyle={styles.dangerRow}
        >
          <Icon name="signout" size={22} color={Colors.accentSecondary} />
          <View style={styles.dangerCopy}>
            <Text style={[styles.dangerTitle, { color: Colors.accentSecondary }]}>SIGN OUT</Text>
            <Text style={styles.dangerSub}>Your data stays on the account</Text>
          </View>
        </StickerPressable>

        <StickerPressable
          color={Colors.accentWarm}
          radius={16}
          shadow={5}
          onPress={handleClearToday}
          contentStyle={styles.dangerRow}
        >
          <Icon name="trash" size={22} color={Colors.ink} />
          <View style={styles.dangerCopy}>
            <Text style={styles.dangerTitle}>CLEAR TODAY</Text>
            <Text style={[styles.dangerSub, styles.onInk]}>Wipes today&apos;s meals only</Text>
          </View>
        </StickerPressable>

        <StickerPressable
          color={Colors.accentHot}
          radius={16}
          shadow={5}
          onPress={handleClearAll}
          contentStyle={styles.dangerRow}
        >
          <Icon name="warning" size={22} color={Colors.ink} />
          <View style={styles.dangerCopy}>
            <Text style={styles.dangerTitle}>CLEAR ALL HISTORY</Text>
            <Text style={[styles.dangerSub, styles.onInk]}>Every meal, every day. Gone.</Text>
          </View>
        </StickerPressable>

        <StickerPressable
          color={Colors.accentHot}
          radius={16}
          shadow={5}
          border={4}
          disabled={deletingAccount}
          onPress={handleDeleteAccount}
          contentStyle={styles.dangerRow}
        >
          <Icon name="warning" size={24} color={Colors.ink} strokeWidth={2.8} />
          <View style={styles.dangerCopy}>
            <Text style={styles.dangerTitle}>
              {deletingAccount ? 'DELETING…' : 'DELETE ACCOUNT'}
            </Text>
            <Text style={[styles.dangerSub, styles.onInk]}>
              Account, meals and photos, for good
            </Text>
          </View>
        </StickerPressable>

        <View style={styles.legalRow}>
          <Link href="/privacy" style={styles.legalLink}>
            Privacy
          </Link>
          <Text style={styles.legalDivider}>·</Text>
          <Link href="/terms" style={styles.legalLink}>
            Terms
          </Link>
          <Text style={styles.legalDivider}>·</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </ScrollView>

      <Marquee
        text="YOUR NUMBERS ★ YOUR RULES"
        color={Colors.accentViolet}
        duration={17}
        height={32}
      />
    </View>
  );
}

function SoundToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const t = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    t.value = withTiming(on ? 1 : 0, { duration: 160 });
  }, [on, t]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: t.value * 26 }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel="Sound effects"
      onPress={onToggle}
      style={[styles.track, { backgroundColor: on ? Colors.accentLime : Colors.hairline }]}
    >
      <Animated.View
        style={[styles.knob, { backgroundColor: on ? Colors.ink : Colors.textSecondary }, knobStyle]}
      />
    </Pressable>
  );
}

function SectionTitle({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color }]}>{label}</Text>
      <View style={styles.sectionRule} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 4,
  },
  avatar: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.paper,
  },
  headerChips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 13,
    letterSpacing: 1,
  },
  sectionRule: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.hairline,
    borderRadius: 999,
  },
  field: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 2,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.ink,
    opacity: 0.7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  input: {
    flex: 1,
    // Without minWidth an input keeps its intrinsic width and refuses to
    // shrink, which shoved the unit label outside the card.
    minWidth: 0,
    fontFamily: Fonts.display,
    fontSize: 19,
    color: Colors.ink,
    paddingVertical: 4,
    minHeight: 34,
  },
  unit: {
    flexShrink: 0,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.6,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: Colors.hairline,
    padding: 14,
  },
  soundText: {
    flex: 1,
    gap: 2,
  },
  soundTitle: {
    fontFamily: Fonts.display,
    fontSize: 12,
    color: Colors.paper,
  },
  soundSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  track: {
    width: 62,
    height: 36,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: Colors.ink,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: Colors.ink,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    minHeight: 62,
  },
  dangerCopy: {
    flex: 1,
    gap: 1,
  },
  dangerTitle: {
    fontFamily: Fonts.display,
    fontSize: 12,
    color: Colors.ink,
  },
  dangerSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  onInk: {
    color: Colors.ink,
    opacity: 0.72,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 10,
  },
  legalLink: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.accentSecondary,
  },
  legalDivider: {
    color: Colors.hairline,
  },
  version: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.textMuted,
  },
});
