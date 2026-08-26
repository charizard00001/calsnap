import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArcadeBg from '@/components/ui/ArcadeBg';
import Icon from '@/components/ui/Icon';
import Marquee from '@/components/ui/Marquee';
import Snappy from '@/components/ui/Snappy';
import Sticker from '@/components/ui/Sticker';
import StickerPressable from '@/components/ui/StickerPressable';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Mode = 'signIn' | 'signUp';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      <ArcadeBg glows={[Colors.accentPrimary, Colors.accentSecondary]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: 28 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoBlock}>
            <Snappy size={104} mood="ready" />
            <Text style={styles.wordmark}>CALSNAP</Text>
            <View style={styles.tagline}>
              <Text style={styles.taglineText}>POINT · SHOOT · EAT</Text>
            </View>
            <Text style={styles.pitch}>
              No typing. No hunting a database for &ldquo;dal, homemade&rdquo;. Just
              photograph the plate.
            </Text>
          </View>

          <View style={styles.form}>
            <Sticker color={Colors.paper} radius={16} shadow={5} contentStyle={styles.inputRow}>
              <Icon name="mail" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </Sticker>

            <Sticker color={Colors.paper} radius={16} shadow={5} contentStyle={styles.inputRow}>
              <Icon name="lock" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
              />
            </Sticker>

            {!!error && (
              <Sticker color={Colors.accentHot} radius={14} shadow={4} contentStyle={styles.banner}>
                <Icon name="warning" size={18} color={Colors.ink} strokeWidth={2.8} />
                <Text style={styles.bannerText}>{error}</Text>
              </Sticker>
            )}

            {!!info && (
              <Sticker color={Colors.accentLime} radius={14} shadow={4} contentStyle={styles.banner}>
                <Icon name="info" size={18} color={Colors.ink} strokeWidth={2.8} />
                <Text style={styles.bannerText}>{info}</Text>
              </Sticker>
            )}

            <StickerPressable
              color={Colors.accentPrimary}
              radius={18}
              shadow={6}
              border={4}
              sound="chime"
              disabled={loading}
              onPress={handleEmailAuth}
              contentStyle={styles.cta}
            >
              {loading ? (
                <ActivityIndicator color={Colors.ink} />
              ) : (
                <>
                  <Text style={styles.ctaText}>
                    {mode === 'signIn' ? 'LET ME IN' : 'SIGN ME UP'}
                  </Text>
                  <Icon name="forward" size={22} color={Colors.ink} strokeWidth={3} />
                </>
              )}
            </StickerPressable>

            <View style={styles.orRow}>
              <View style={styles.rule} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.rule} />
            </View>

            <StickerPressable
              color={Colors.paper}
              radius={18}
              shadow={5}
              disabled={loading}
              onPress={handleGoogleAuth}
              contentStyle={styles.googleBtn}
            >
              <Icon name="star" size={20} color={Colors.ink} strokeWidth={2.4} />
              <Text style={styles.googleText}>CONTINUE WITH GOOGLE</Text>
            </StickerPressable>
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                setError(null);
                setInfo(null);
              }}
            >
              <Text style={styles.link}>
                {mode === 'signIn'
                  ? "New here? Make an account"
                  : 'Already have an account? Sign in'}
              </Text>
            </Pressable>

            {mode === 'signIn' && (
              <Pressable onPress={() => router.push('/forgot-password')}>
                <Text style={styles.linkQuiet}>Forgot password?</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Marquee
        text="20 FREE SCANS A DAY ★ NO CARD"
        color={Colors.accentLime}
        duration={13}
        height={34}
        style={{ marginBottom: insets.bottom }}
      />
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
    paddingHorizontal: 22,
    gap: 22,
  },
  logoBlock: {
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontFamily: Fonts.display,
    fontSize: 46,
    lineHeight: 52,
    color: Colors.paper,
  },
  tagline: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: Colors.accentLime,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  taglineText: {
    fontFamily: Fonts.display,
    fontSize: 11,
    color: Colors.accentLime,
  },
  pitch: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  form: {
    gap: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    minHeight: 58,
  },
  ctaText: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.ink,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rule: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.hairline,
    borderRadius: 999,
  },
  orText: {
    fontFamily: Fonts.display,
    fontSize: 10,
    color: Colors.textMuted,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
  },
  googleText: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: Colors.ink,
  },
  footer: {
    alignItems: 'center',
    gap: 8,
  },
  link: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.accentGold,
  },
  linkQuiet: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
