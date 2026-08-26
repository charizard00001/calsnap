import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSizes, Spacing } from '@/constants/theme';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>Terms of Service</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.updated}>Last updated: August 2026</Text>

        <Section title="What CalSnap is">
          CalSnap analyzes photos of food you take and estimates calories
          and macronutrients using AI. Estimates are approximations, not
          medical or nutritional advice — always use your own judgment,
          especially for medical dietary needs.
        </Section>

        <Section title="Accuracy">
          AI-generated nutrition estimates can be wrong, sometimes
          significantly. You can review and edit every estimate before
          saving it, and edit or delete any saved meal afterward.
        </Section>

        <Section title="Fair use">
          Daily AI analysis is rate-limited per account to keep the service
          available for everyone. Don't attempt to abuse, scrape, or
          circumvent these limits.
        </Section>

        <Section title="Your account">
          You're responsible for keeping your account credentials secure.
          You can delete your account and all associated data at any time
          from Settings.
        </Section>

        <Section title="Changes">
          These terms may be updated as CalSnap evolves. Continued use of
          the app after a change means you accept the updated terms.
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
