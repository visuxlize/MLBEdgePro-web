import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";

const LAST_UPDATED = "May 28, 2026";
const VERSION = "1.1";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-[#FF7828] text-xs font-bold tracking-[0.08em] uppercase mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Body({ children }: { children: string }) {
  return (
    <p className="text-white/55 text-sm leading-relaxed whitespace-pre-line">{children}</p>
  );
}

function Bullet({ children }: { children: string }) {
  return (
    <div className="flex gap-3 mb-2">
      <span className="text-[#FF7828] text-sm mt-px shrink-0">•</span>
      <p className="text-white/55 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0E14]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#FF7828]/[0.05] blur-[120px]" />

      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0A0E14]/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] transition-colors shrink-0"
          >
            <ArrowLeft size={16} className="text-white/60" />
          </Link>
          <div>
            <p className="text-[10px] font-bold text-white/30 tracking-[0.12em] uppercase">Legal</p>
            <h1 className="text-lg font-black text-white tracking-tight leading-tight">Privacy Policy</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7828]/20 bg-[#FF7828]/[0.08] px-4 py-1.5 mb-8">
          <Zap size={11} className="text-[#FF7828]" strokeWidth={2.5} />
          <span className="text-xs font-bold text-[#FF7828] tracking-wider uppercase">MLB Edge Pro</span>
        </div>

        {/* Effective date */}
        <div className="rounded-xl border border-[#FF7828]/15 bg-[#FF7828]/[0.06] px-4 py-3 mb-10 text-sm text-white/45">
          Last updated: {LAST_UPDATED}
        </div>

        <Section title="1. Introduction">
          <Body>
            {`MLB Edge Pro ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use the MLB Edge Pro mobile application and web platform (the "App"). By using the App, you agree to the practices described in this policy.`}
          </Body>
        </Section>

        <Section title="2. Information We Collect">
          <Body>{`We collect the following information:\n`}</Body>
          <Bullet>Account information you provide during registration, including your name, email address, and password.</Bullet>
          <Bullet>App preferences and settings, such as your favorite team selection.</Bullet>
          <Bullet>Usage data, including which features you interact with and how frequently.</Bullet>
          <Bullet>Device information, such as operating system version and device type, to improve compatibility.</Bullet>
          <Bullet>Prop Builder data: saved slip legs, optional wager amounts, FanDuel odds lines you enter, and win/loss outcomes you voluntarily record. This data is stored locally on your device.</Bullet>
        </Section>

        <Section title="2a. Prop Builder & Bet Slip Data">
          <Body>
            {`The Prop Builder feature allows you to save hypothetical betting slips and record their outcomes. All slip data — including player props, wager amounts, odds lines, and results — is stored locally on your device.\n\nWe may collect anonymized, aggregated win/loss outcome data to improve prediction accuracy over time. This data cannot identify you individually and is used solely for model improvement. Specifically:\n`}
          </Body>
          <Bullet>We do not collect your wager amounts or financial data on our servers.</Bullet>
          <Bullet>FanDuel odds lines you enter are stored only on your device.</Bullet>
          <Bullet>Anonymized win/loss outcomes (without any personally identifying information) may be used to improve the App's predictive models.</Bullet>
          <Bullet>You may delete all saved slips at any time by removing and reinstalling the App or clearing App storage in your device settings.</Bullet>
          <Body>{`\nRecording a slip outcome in the App does not constitute placing or settling a real bet. All actual wagering activity occurs entirely on third-party platforms.`}</Body>
        </Section>

        <Section title="3. How We Use Your Information">
          <Body>{`Your information is used to:\n`}</Body>
          <Bullet>Provide, maintain, and improve the App's features and functionality.</Bullet>
          <Bullet>Personalize your experience based on your preferences and favorite team.</Bullet>
          <Bullet>Respond to support requests and communicate important updates.</Bullet>
          <Bullet>Analyze usage trends to enhance performance and reliability.</Bullet>
          <Bullet>Improve prop prediction accuracy using anonymized, aggregated slip outcome data.</Bullet>
        </Section>

        <Section title="4. Data Storage">
          <Body>
            {`Account data and prop builder slips are stored locally on your device. We do not transmit your personal credentials or slip details to any external server. MLB game data is fetched from the official MLB Stats API (statsapi.mlb.com) and is subject to MLB's own privacy practices.`}
          </Body>
        </Section>

        <Section title="5. Third-Party Services">
          <Body>{`The App connects to the following third-party services to provide its core functionality:\n`}</Body>
          <Bullet>MLB Stats API — game schedules, scores, player stats, and lineups.</Bullet>
          <Bullet>Open-Meteo API — weather data for stadium conditions. No personal data is shared with this service.</Bullet>
          <Body>{`\nThese services have their own privacy policies. We encourage you to review them independently.`}</Body>
        </Section>

        <Section title="6. Data Security">
          <Body>
            {`We implement industry-standard security measures to protect your information. However, no method of electronic storage is 100% secure. We strive to use commercially acceptable means to protect your data, but cannot guarantee absolute security.`}
          </Body>
        </Section>

        <Section title="7. Responsible Gaming Disclaimer">
          <Body>
            {`MLB Edge Pro provides analytical insights for informational and educational purposes only. The App does not facilitate, promote, or engage in gambling or sports betting. Prediction accuracy is not guaranteed. If you choose to use our data to inform betting decisions, please do so responsibly and in accordance with your local laws and regulations.`}
          </Body>
        </Section>

        <Section title="8. Children's Privacy">
          <Body>
            {`The App is not intended for users under the age of 17. We do not knowingly collect personal information from children under 17. If you believe a child has provided us with personal data, please contact us so we can take appropriate action.`}
          </Body>
        </Section>

        <Section title="9. Your Rights">
          <Body>{`You have the right to:\n`}</Body>
          <Bullet>Access the personal data we hold about you.</Bullet>
          <Bullet>Request correction of inaccurate data.</Bullet>
          <Bullet>Delete your account and associated data at any time from within the App settings.</Bullet>
        </Section>

        <Section title="10. Changes to This Policy">
          <Body>
            {`We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date. Continued use of the App after changes constitutes your acceptance of the revised policy.`}
          </Body>
        </Section>

        <Section title="11. Contact Us">
          <Body>{`If you have questions about this Privacy Policy, please contact us at:\n\nMLB Edge Pro\nsupport@mlbedgepro.app`}</Body>
        </Section>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
          <p className="text-white/20 text-xs font-semibold">MLB Edge Pro — Privacy Policy</p>
          <p className="text-white/15 text-xs mt-1">Version {VERSION}</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/terms" className="text-xs text-white/30 hover:text-white transition-colors">Terms of Service</Link>
            <span className="text-white/15">·</span>
            <Link href="/responsible-gambling" className="text-xs text-white/30 hover:text-white transition-colors">Responsible Gambling</Link>
            <span className="text-white/15">·</span>
            <Link href="/" className="text-xs text-white/30 hover:text-white transition-colors">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
