import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";

const LAST_UPDATED = "June 12, 2026";
const VERSION = "1.2";

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

export default function TermsPage() {
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
            <h1 className="text-lg font-black text-white tracking-tight leading-tight">Terms of Service</h1>
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

        <Section title="1. Acceptance of Terms">
          <Body>
            {`By downloading, installing, or using MLB Edge Pro (the "App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App. These Terms constitute a legally binding agreement between you and MLB Edge Pro.`}
          </Body>
        </Section>

        <Section title="2. Description of Service">
          <Body>{`MLB Edge Pro is a baseball analytics application that provides:\n`}</Body>
          <Bullet>Real-time MLB game scores, schedules, and standings.</Bullet>
          <Bullet>Player and pitcher performance statistics sourced from the official MLB Stats API.</Bullet>
          <Bullet>AI-assisted game predictions and analytical insights for informational purposes.</Bullet>
          <Bullet>Weather data to assess stadium conditions and their potential impact on games.</Bullet>
          <Bullet>A Prop Builder tool that lets users track hypothetical betting slips, log wager details, and record outcomes for personal analysis.</Bullet>
          <Bullet>Limited-time FIFA World Cup 2026 analysis and predictive content for Pro subscribers (available while the event is active).</Bullet>
        </Section>

        <Section title="2a. Prop Builder & Slip Tracking">
          <Body>
            {`The Prop Builder feature allows you to construct hypothetical prop bet slips using model-generated probability estimates. You may optionally save slips locally on your device, record wager amounts, potential payouts, FanDuel odds lines, and mark outcomes as won or lost.\n\nThis data is stored on your device and may be used in aggregate, anonymized form to improve prediction accuracy. You acknowledge that:\n`}
          </Body>
          <Bullet>Saved slips and outcomes are stored locally on your device.</Bullet>
          <Bullet>Win/loss data you record may be used — in anonymized, aggregated form — to improve the App's predictive models.</Bullet>
          <Bullet>MLB Edge Pro is not a sportsbook and does not facilitate actual wagering. Recording a slip does not constitute placing a real bet.</Bullet>
          <Bullet>You are solely responsible for any actual bets you place on third-party platforms such as FanDuel.</Bullet>
        </Section>

        <Section title="2b. FIFA World Cup 2026 Content (Limited Time)">
          <Body>
            {`MLB Edge Pro offers FIFA World Cup 2026 analytical content as a limited-time feature for active Pro-tier subscribers. This content includes match predictions, bracket analysis, head-to-head comparisons, and World Cup betting market insights.\n\nThis feature is provided on an as-available basis and may be removed or modified at any time without prior notice once the 2026 FIFA World Cup tournament concludes. Access is contingent on maintaining an active Pro subscription. World Cup content is subject to the same disclaimers as all other analytical content — it is for informational and entertainment purposes only and does not constitute betting advice.`}
          </Body>
        </Section>

        <Section title="3. Not a Gambling Platform">
          <Body>
            {`MLB Edge Pro is strictly an informational and educational analytics tool. We are NOT a sports betting platform, gambling service, or licensed gambling operator. Any analytical content provided by the App — including win predictions, edge scores, or player props — is for educational and entertainment purposes only.\n\nPredictions generated by our models are not guaranteed to be accurate. Past predictive performance does not guarantee future results. You assume full responsibility for any decisions you make based on information provided by the App.`}
          </Body>
        </Section>

        <Section title="4. User Accounts">
          <Body>{`To access certain features of the App, you must create an account. You agree to:\n`}</Body>
          <Bullet>Provide accurate and complete registration information.</Bullet>
          <Bullet>Maintain the security of your account credentials.</Bullet>
          <Bullet>Notify us immediately of any unauthorized use of your account.</Bullet>
          <Bullet>Be at least 17 years of age to create an account.</Bullet>
          <Body>{`\nYou are solely responsible for all activity that occurs under your account.`}</Body>
        </Section>

        <Section title="5. Intellectual Property">
          <Body>
            {`The App, including its design, code, logos, and content (excluding MLB statistical data), is owned by MLB Edge Pro and protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works without our prior written consent.\n\nMLB statistical data is provided under license from MLB Advanced Media, L.P. MLB trademarks and copyrights are the property of their respective owners.`}
          </Body>
        </Section>

        <Section title="6. Permitted Use">
          <Body>{`You agree to use the App only for lawful purposes and in accordance with these Terms. You agree not to:\n`}</Body>
          <Bullet>Use the App in any way that violates applicable local, national, or international laws.</Bullet>
          <Bullet>Reverse engineer, decompile, or attempt to extract the App's source code.</Bullet>
          <Bullet>Use automated scripts or bots to access or interact with the App.</Bullet>
          <Bullet>Resell, sublicense, or commercially exploit the App's content or data.</Bullet>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <Body>
            {`THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES. ANALYTICAL PREDICTIONS AND INSIGHTS ARE PROVIDED WITHOUT ANY WARRANTY OF ACCURACY OR FITNESS FOR A PARTICULAR PURPOSE.\n\nWE EXPRESSLY DISCLAIM ALL WARRANTIES RELATED TO THE ACCURACY OF PREDICTIONS, STATISTICAL ANALYSIS, OR ANY EXPECTED OUTCOME.`}
          </Body>
        </Section>

        <Section title="8. Limitation of Liability">
          <Body>
            {`TO THE MAXIMUM EXTENT PERMITTED BY LAW, MLB EDGE PRO AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL — ARISING FROM YOUR USE OF OR INABILITY TO USE THE APP.\n\nIN NO EVENT WILL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID FOR THE APP IN THE PAST TWELVE MONTHS (IF ANY).`}
          </Body>
        </Section>

        <Section title="9. Responsible Gaming">
          <Body>
            {`If you choose to use data from this App in connection with sports betting, you do so entirely at your own risk. MLB Edge Pro strongly encourages responsible gaming. If you or someone you know may have a gambling problem, contact the National Problem Gambling Helpline at 1-800-522-4700 (US) or visit ncpgambling.org.`}
          </Body>
        </Section>

        <Section title="10. Termination">
          <Body>
            {`We reserve the right to suspend or terminate your access to the App at any time, for any reason, without notice. You may delete your account at any time from within the App's Settings screen. Upon termination, your right to use the App will immediately cease.`}
          </Body>
        </Section>

        <Section title="11. Changes to Terms">
          <Body>
            {`We reserve the right to modify these Terms at any time. We will provide notice of material changes by updating the "Last updated" date. Your continued use of the App after changes take effect constitutes your acceptance of the revised Terms.`}
          </Body>
        </Section>

        <Section title="12. Governing Law">
          <Body>
            {`These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the App shall be resolved through binding arbitration.`}
          </Body>
        </Section>

        <Section title="13. Contact">
          <Body>{`Questions about these Terms? Contact us at:\n\nMLB Edge Pro\nsupport@mlbedgepro.app`}</Body>
        </Section>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
          <p className="text-white/20 text-xs font-semibold">MLB Edge Pro — Terms of Service</p>
          <p className="text-white/15 text-xs mt-1">Version {VERSION}</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white transition-colors">Privacy Policy</Link>
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
