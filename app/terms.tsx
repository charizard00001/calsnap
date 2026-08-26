import LegalPage, { Section } from '@/components/ui/LegalPage';

export default function TermsScreen() {
  return (
    <LegalPage title="TERMS" updated="LAST UPDATED: AUGUST 2026">
      <Section title="What CalSnap is">
        CalSnap analyzes photos of food you take and estimates calories and
        macronutrients using AI. Estimates are approximations, not medical or
        nutritional advice — always use your own judgment, especially for medical
        dietary needs.
      </Section>

      <Section title="Accuracy">
        AI-generated nutrition estimates can be wrong, sometimes significantly. You
        can review and edit every estimate before saving it, and edit or delete any
        saved meal afterward.
      </Section>

      <Section title="Fair use">
        Daily AI analysis is rate-limited per account to keep the service available
        for everyone. Don't attempt to abuse, scrape, or circumvent these limits.
      </Section>

      <Section title="Your account">
        You're responsible for keeping your account credentials secure. You can
        delete your account and all associated data at any time from Settings.
      </Section>

      <Section title="Changes">
        These terms may be updated as CalSnap evolves. Continued use of the app
        after a change means you accept the updated terms.
      </Section>
    </LegalPage>
  );
}
