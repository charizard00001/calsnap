import ArcadeBg from '@/components/ui/ArcadeBg';
import Icon from '@/components/ui/Icon';
import StickerPressable from '@/components/ui/StickerPressable';
import { Colors, Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Shared chrome for the privacy and terms pages. */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ArcadeBg glows={[Colors.accentSecondary, Colors.accentViolet]} grid={false} />

      <View style={{ height: insets.top }} />

      <View style={styles.header}>
        <StickerPressable
          color={Colors.paper}
          radius={14}
          shadow={4}
          onPress={() => router.back()}
          contentStyle={styles.backBtn}
          accessibilityLabel="Back"
        >
          <Icon name="back" size={22} color={Colors.ink} strokeWidth={3} />
        </StickerPressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>{updated}</Text>
        {children}
      </ScrollView>
    </View>
  );
}

export function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  backBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 46,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.paper,
  },
  content: {
    paddingHorizontal: 20,
  },
  updated: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.textMuted,
    marginBottom: 22,
  },
  section: {
    marginBottom: 22,
    gap: 7,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: Colors.accentLime,
  },
  sectionBody: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
});
