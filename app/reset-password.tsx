import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Appear } from '@/components/Appear';
import CrazyButton from '@/components/CrazyButton';
import ParticleBackground from '@/components/ParticleBackground';
import { Colors, FontSizes, Gradients, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useRecoveryContext } from './_layout';

// Reached via the link in the password-reset email. Supabase's
// `detectSessionInUrl` picks up the recovery token from the URL fragment and
// establishes a (recovery-scoped) session automatically before this screen
// mounts — see the PASSWORD_RECOVERY handling in app/_layout.tsx, which
// routes here instead of the dashboard for that event.
export default function ResetPasswordScreen() {
  const router = useRouter();
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
      <ParticleBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Appear from="none" style={styles.content}>
          <Text style={styles.title}>Set New Password</Text>

          {done ? (
            <Text style={styles.subtitle}>Password updated. Taking you in...</Text>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="New password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <CrazyButton
                onPress={handleReset}
                gradient={Gradients.purpleToBlue}
                loading={loading}
                style={styles.primaryBtn}
              >
                Update Password
              </CrazyButton>
            </>
          )}
        </Appear>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 320,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentPrimary,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  primaryBtn: {
    width: '100%',
    maxWidth: 320,
    marginTop: Spacing.sm,
  },
});
