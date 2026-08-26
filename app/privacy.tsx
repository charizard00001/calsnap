import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSizes, Spacing } from '@/constants/theme';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>Privacy Policy</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.updated}>Last updated: August 2026</Text>

        <Section title="What we collect">
          Your email address, the photos you take of meals, and the nutrition
          data (calories, protein, carbs, fat) generated from those photos.
          If you sign in with Google, we receive your name and email from
          Google — nothing else from your Google account.
        </Section>

        <Section title="How we use it">
          Meal photos are sent to Google Gemini and, as a fallback,
          OpenRouter, solely to identify food and estimate its nutrition
          content. Your data is used only to run CalSnap for you: storing
          your meal history, computing your daily totals, and displaying
          your logged meals back to you.
        </Section>

        <Section title="Where it's stored">
          Your account, meal data, and photos are stored with Supabase. We
          do not sell your data or share it with advertisers.
        </Section>

        <Section title="Your controls">
          You can edit or delete individual meals at any time. You can
          delete your entire meal history from Settings. You can delete your
          account entirely — this removes your account, every meal you've
          logged, and every photo — from Settings → Danger Zone.
        </Section>

        <Section title="Contact">
          Questions about your data? Reach out to the developer via the
          contact info on the app's listing.
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  content: {
    padding: Spacing.md,
    paddingTop: 60,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  updated: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionBody: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
