import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Enter your account email.');
      return;
    }
    if (Platform.OS !== 'web') {
      setError('Password reset is available on the web app for now.');
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {sent
              ? "Check your email for a reset link."
              : "We'll email you a link to reset your password."}
          </Text>

          {!sent && (
            <>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <CrazyButton
                onPress={handleSend}
                gradient={Gradients.purpleToBlue}
                loading={loading}
                style={styles.primaryBtn}
              >
                Send Reset Link
              </CrazyButton>
            </>
          )}

          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>Back to sign in</Text>
          </Pressable>
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
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    maxWidth: 320,
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
  backText: {
    marginTop: Spacing.xl,
    fontSize: FontSizes.sm,
    color: Colors.accentSecondary,
  },
});
