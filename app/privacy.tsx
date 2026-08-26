import LegalPage, { Section } from '@/components/ui/LegalPage';

export default function PrivacyScreen() {
  return (
    <LegalPage title="PRIVACY" updated="LAST UPDATED: AUGUST 2026">
      <Section title="What we collect">
        Your email address, the photos you take of meals, and the nutrition data
        (calories, protein, carbs, fat) generated from those photos. If you sign in
        with Google, we receive your name and email from Google — nothing else from
        your Google account.
      </Section>

      <Section title="How we use it">
        Meal photos are sent to Google Gemini and, as a fallback, OpenRouter, solely
        to identify food and estimate its nutrition content. Your data is used only
        to run CalSnap for you: storing your meal history, computing your daily
        totals, and displaying your logged meals back to you.
      </Section>

      <Section title="Where it's stored">
        Your account, meal data, and photos are stored with Supabase. We do not sell
        your data or share it with advertisers.
      </Section>

      <Section title="Your controls">
        You can edit or delete individual meals at any time. You can delete your
        entire meal history from Settings. You can delete your account entirely —
        this removes your account, every meal you've logged, and every photo — from
        Settings → Danger Zone.
      </Section>

      <Section title="Contact">
        Questions about your data? Reach out to the developer via the contact info
        on the app's listing.
      </Section>
    </LegalPage>
  );
}
