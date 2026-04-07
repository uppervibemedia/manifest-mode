import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground text-sm mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Legal</p>
        <h1 className="font-playfair text-2xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mb-8">Last updated: April 2026</p>

        <div className="space-y-6 text-sm text-foreground/80 leading-relaxed">
          <Section title="1. Information We Collect">
            We collect information you provide directly to us when you create an account, complete the onboarding assessment, and use the app. This includes your name, email address, assessment responses, journal entries, vision board content, habit data, and subscription information.
          </Section>

          <Section title="2. How We Use Your Information">
            We use your information to:
            <ul className="list-disc list-inside mt-2 space-y-1 text-foreground/70">
              <li>Provide, personalize, and improve the Manifest Mode experience</li>
              <li>Generate your Reality Match Score and AI-powered insights</li>
              <li>Send daily reminder emails (only if you enable them)</li>
              <li>Process subscription payments via Stripe</li>
              <li>Communicate with you about your account</li>
            </ul>
          </Section>

          <Section title="3. AI-Generated Content">
            Manifest Mode uses large language models (LLMs) to generate personalized insights, affirmations, and coaching content. Your assessment data and journal entries may be sent to these AI services to generate responses. We do not use your personal data to train AI models.
          </Section>

          <Section title="4. Data Storage & Security">
            Your data is stored securely using industry-standard encryption. We retain your data for as long as your account is active. You can delete your account and all associated data at any time from the Profile page.
          </Section>

          <Section title="5. Third-Party Services">
            We use the following third-party services:
            <ul className="list-disc list-inside mt-2 space-y-1 text-foreground/70">
              <li><strong>Stripe</strong> — for payment processing (web)</li>
              <li><strong>RevenueCat</strong> — for in-app purchases (iOS)</li>
              <li><strong>AI providers</strong> — for generating personalized content</li>
            </ul>
            These services have their own privacy policies and we encourage you to review them.
          </Section>

          <Section title="6. Data Sharing">
            We do not sell, trade, or rent your personal information to third parties. We may share anonymized, aggregated data for analytics purposes.
          </Section>

          <Section title="7. Your Rights">
            You have the right to access, correct, or delete your personal data at any time. To delete your account and all data, go to Profile → Delete Account. For other requests, contact us at the email below.
          </Section>

          <Section title="8. Children's Privacy">
            Manifest Mode is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.
          </Section>

          <Section title="9. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice.
          </Section>

          <Section title="10. Contact Us">
            If you have any questions about this Privacy Policy, please contact us at:
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