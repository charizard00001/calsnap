import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import Icon from '@/components/ui/Icon';
import Snappy from '@/components/ui/Snappy';
import Sticker from '@/components/ui/Sticker';
import StickerPressable from '@/components/ui/StickerPressable';
import { Colors, Fonts } from '@/constants/theme';
import { sfx } from '@/lib/sfx';
import { supabase } from '@/lib/supabase';
import { useRecoveryContext } from './_layout';

// Reached via the link in the password-reset email. Supabase's
// `detectSessionInUrl` picks up the recovery token from the URL fragment and
// establishes a (recovery-scoped) session automatically before this screen
// mounts — see the PASSWORD_RECOVERY handling in app/_layout.tsx, which
// routes here instead of the dashboard for that event.
export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clearRecovery } = useRecoveryContext();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      sfx('fanfare');
      setTimeout(() => {
        clearRecovery();
        router.replace('/(tabs)');
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ArcadeBg glows={[Colors.accentPrimary, Colors.accentLime]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Snappy size={92} mood={done ? 'streak' : 'ready'} />

          <Text style={styles.title}>SET A NEW{'\n'}PASSWORD</Text>

          {done ? (
            <Text style={styles.sub}>Password updated. Taking you in…</Text>
          ) : (
            <View style={styles.form}>
              <Sticker color={Colors.paper} radius={16} shadow={5} contentStyle={styles.inputRow}>
                <Icon name="lock" size={20} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="new password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
              </Sticker>

              <Sticker color={Colors.paper} radius={16} shadow={5} contentStyle={styles.inputRow}>
                <Icon name="lock" size={20} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="confirm password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
              </Sticker>

              {!!error && (
                <Sticker color={Colors.accentHot} radius={14} shadow={4} contentStyle={styles.banner}>
                  <Icon name="warning" size={18} color={Colors.ink} strokeWidth={2.8} />
                  <Text style={styles.bannerText}>{error}</Text>
                </Sticker>
              )}

              <StickerPressable
                color={Colors.accentLime}
                radius={18}
                shadow={6}
                border={4}
                sound={null}
                disabled={loading}
                onPress={handleReset}
                contentStyle={styles.cta}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.ink} />
                ) : (
                  <Text style={styles.ctaText}>UPDATE PASSWORD</Text>
                )}
              </StickerPressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.paper,
    textAlign: 'center',
  },
  sub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
  },
  form: {
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.ink,
    paddingVertical: 12,
    minHeight: 46,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  bannerText: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.ink,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
  },
  ctaText: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.ink,
  },
});
