import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

export default function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground text-sm mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Legal</p>
        <h1 className="font-playfair text-2xl font-semibold mb-2">Terms of Use</h1>
        <p className="text-xs text-muted-foreground mb-8">Last updated: April 2026</p>

        <div className="space-y-6 text-sm text-foreground/80 leading-relaxed">
          <Section title="1. Acceptance of Terms">
            By using Manifest Mode, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the app.
          </Section>

          <Section title="2. Description of Service">
            Manifest Mode is a personal development app that helps users visualize goals, track habits, assess personal alignment, and receive AI-powered coaching. The app is available on web and iOS.
          </Section>

          <Section title="3. User Accounts">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account.
          </Section>

          <Section title="4. Subscriptions & Billing">
            <ul className="list-disc list-inside space-y-1 text-foreground/70">
              <li>Free plan features are available at no cost</li>
              <li>Plus and Premium plans are billed monthly or annually via Stripe (web) or Apple In-App Purchase (iOS)</li>
              <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
              <li>7-day free trials are available for the Plus plan (monthly billing)</li>
              <li>Refunds are handled per Stripe's and Apple's respective refund policies</li>
              <li>To cancel, manage your subscription via the Profile page or your device's App Store settings</li>
            </ul>
          </Section>

          <Section title="5. Acceptable Use">
            You agree not to:
            <ul className="list-disc list-inside mt-2 space-y-1 text-foreground/70">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to reverse-engineer or tamper with the app</li>
              <li>Upload harmful, offensive, or infringing content</li>
              <li>Share your account credentials with others</li>
            </ul>
          </Section>

          <Section title="6. AI-Generated Content">
            Manifest Mode uses AI to generate personalized insights, affirmations, and coaching content. This content is for personal development purposes only and does not constitute medical, psychological, or financial advice. Always consult a qualified professional for such needs.
          </Section>

          <Section title="7. Intellectual Property">
            All content, design, and technology within Manifest Mode is owned by or licensed to us. You may not reproduce, distribute, or create derivative works without our express written permission.
          </Section>

          <Section title="8. User Content">
            You retain ownership of content you create (journal entries, vision board images, etc.). By using the app, you grant us a limited license to store and process your content to provide the service.
          </Section>

          <Section title="9. Disclaimer of Warranties">
            Manifest Mode is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or that results from using the app will meet your expectations.
          </Section>

          <Section title="10. Limitation of Liability">
            To the fullest extent permitted by law, Manifest Mode shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
          </Section>

          <Section title="11. Termination">
            We reserve the right to suspend or terminate your account if you violate these Terms of Use. You may delete your account at any time from the Profile page.
          </Section>

          <Section title="12. Changes to Terms">
            We may update these Terms of Use at any time. Continued use of the app after changes constitutes acceptance of the new terms.
          </Section>

          <Section title="13. Contact Us">
            For questions about these Terms, please contact us at:
            <p className="mt-2 text-primary font-medium">support@manifestmode.app</p>
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}

function Section({ title, children }) {
  return (
    <div className="glass-card rounded-xl p-4 border border-border">
      <h2 className="font-semibold text-foreground mb-2 text-sm">{title}</h2>
      <div className="text-xs text-foreground/70 leading-relaxed">{children}</div>
    </div>
  );
}