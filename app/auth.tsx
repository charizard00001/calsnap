import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import ParticleBackground from '@/components/ParticleBackground';
import { BorderRadius, Colors, FontSizes, Gradients, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Mode = 'signIn' | 'signUp';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleEmailAuth = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError('Enter an email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signUp') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo('Check your email to confirm your account, then sign in.');
          setMode('signIn');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
      // Successful sign-in routes automatically via the session listener in root layout.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setInfo(null);
    if (Platform.OS !== 'web') {
      setError('Google sign-in is available on the web app for now.');
      return;
    }
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (oauthError) throw oauthError;
      // Browser redirects to Google; no further action needed here.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
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
        <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
          <Text style={styles.title}>CalSnap</Text>
          <Text style={styles.subtitle}>
            {mode === 'signIn' ? 'Welcome back, Sorcerer' : 'Begin your training'}
          </Text>

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
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'signUp' ? 'new-password' : 'password'}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}
          {info && <Text style={styles.infoText}>{info}</Text>}

          <Pressable onPress={handleEmailAuth} style={styles.primaryBtn} disabled={loading}>
            <LinearGradient colors={Gradients.purpleToBlue} style={styles.primaryBtnGradient}>
              {loading ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'signIn' ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          {Platform.OS === 'web' && (
            <Pressable onPress={handleGoogleAuth} style={styles.googleBtn} disabled={loading}>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              setError(null);
              setInfo(null);
              setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
            }}
          >
            <Text style={styles.switchModeText}>
              {mode === 'signIn'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </Animated.View>
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
    fontSize: FontSizes.display,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.jjkPurple,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  infoText: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  primaryBtn: {
    width: '100%',
    maxWidth: 320,
    marginTop: Spacing.sm,
  },
  primaryBtnGradient: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  googleBtn: {
    width: '100%',
    maxWidth: 320,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.textMuted + '60',
    alignItems: 'center',
  },
  googleBtnText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  switchModeText: {
    marginTop: Spacing.xl,
    fontSize: FontSizes.sm,
    color: Colors.jjkBlue,
  },
});
