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
import Snappy from '@/components/ui/Snappy';
import Sticker from '@/components/ui/Sticker';
import StickerPressable from '@/components/ui/StickerPressable';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      <ArcadeBg glows={[Colors.accentViolet, Colors.accentSecondary]} />

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
          <Snappy size={92} mood={sent ? 'ready' : 'flat'} color={Colors.accentViolet} />

          <Text style={styles.title}>LOCKED OUT?</Text>
          <Text style={styles.sub}>
            {sent
              ? 'Check your email for the reset link. It expires in an hour.'
              : "Tell us the email on your account and we'll send a reset link."}
          </Text>

          {!sent && (
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

              {!!error && (
                <Sticker color={Colors.accentHot} radius={14} shadow={4} contentStyle={styles.banner}>
                  <Icon name="warning" size={18} color={Colors.ink} strokeWidth={2.8} />
                  <Text style={styles.bannerText}>{error}</Text>
                </Sticker>
              )}

              <StickerPressable
                color={Colors.accentPrimary}
                radius={18}
                shadow={6}
                border={4}
                disabled={loading}
                onPress={handleSend}
                contentStyle={styles.cta}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.ink} />
                ) : (
                  <Text style={styles.ctaText}>SEND RESET LINK</Text>
                )}
              </StickerPressable>
            </View>
          )}

          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.link}>Back to sign in</Text>
          </Pressable>
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
    fontSize: 30,
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
  backBtn: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 6,
  },
  link: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.accentSecondary,
  },
});
