import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setError(null);
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

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: 28 },
        ]}
        showsVerticalScrollIndicator={false}
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
            sound="chime"
            disabled={loading}
            onPress={handleGoogleAuth}
            contentStyle={styles.cta}
          >
            {loading ? (
              <ActivityIndicator color={Colors.ink} />
            ) : (
              <>
                <Text style={styles.ctaText}>CONTINUE WITH GOOGLE</Text>
                <Icon name="forward" size={22} color={Colors.ink} strokeWidth={3} />
              </>
            )}
          </StickerPressable>

          <Text style={styles.reassure}>
            One tap. No password to remember, nothing to confirm in your inbox.
          </Text>
        </View>
      </ScrollView>

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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 30,
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
    gap: 14,
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
    fontSize: 16,
    color: Colors.ink,
  },
  reassure: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
