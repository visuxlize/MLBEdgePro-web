import Link from "next/link";
import { Github } from "lucide-react";
import { Container } from "./container";

function DiamondLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L4 10l10 16 10-16L14 2z" stroke="#1a73ff" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(26,115,255,0.12)" />
      <path d="M4 10h20M14 2l-5 8h10L14 2z" stroke="#1a73ff" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-[#14161b]/[.09]">
      <Container>
        {/* Main footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 py-12">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <DiamondLogo />
              <span className="text-[15px] font-bold text-[#14161b]">
                Edge<span className="text-[#1a73ff]"> Pro</span>
              </span>
            </div>
            <p className="text-sm text-[#14161b]/56 leading-relaxed max-w-xs">
              Live NBA, NFL &amp; soccer analysis with real DraftKings prop lines. Free to start.
              More sports every season.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://github.com/visuxlize" target="_blank" rel="noopener noreferrer" className="text-[#14161b]/46 hover:text-[#14161b] transition-colors">
                <Github size={17} strokeWidth={1.6} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold text-[#14161b]/46 tracking-widest uppercase mb-4">Product</p>
            <ul className="space-y-3">
              {[
                { label: "Features",    href: "/#features" },
                { label: "Pricing",     href: "/#pricing" },
                { label: "Results",     href: "/results" },
                { label: "Live tour",   href: "/#tour" },
                { label: "Mobile app (coming soon)", href: "/download" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-[#14161b]/56 hover:text-[#14161b] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold text-[#14161b]/46 tracking-widest uppercase mb-4">Legal &amp; Safety</p>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy",        href: "/privacy" },
                { label: "Terms of Service",      href: "/terms" },
                { label: "Responsible Gambling",  href: "/responsible-gambling" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-[#14161b]/56 hover:text-[#14161b] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t border-[#14161b]/[.09]">
              <p className="text-[11px] text-[#14161b]/46 font-bold">Problem Gambling Helpline</p>
              <a href="tel:18005224700" className="text-sm font-black text-[#12a150] hover:text-[#12a150] transition-colors">
                1-800-522-4700
              </a>
              <p className="text-[10px] text-[#14161b]/38 mt-0.5">24/7 · Free · Confidential</p>
            </div>
          </div>
        </div>

        {/* Disclaimer bar */}
        <div className="border-t border-[#14161b]/[.09] py-6">
          <p className="text-[11px] text-[#14161b]/46 leading-relaxed text-center max-w-4xl mx-auto">
            <span className="font-black text-[#14161b]/56">DISCLAIMER:</span> Edge Pro is provided for entertainment and informational purposes only.
            All projections and model outputs are opinions based on statistical analysis — they are{" "}
            <span className="font-bold text-[#14161b]/56">not guarantees of any outcome</span>.
            Sports betting involves substantial financial risk. Must be 21+.{" "}
            <Link href="/terms" className="text-[#12a150]/70 hover:text-[#12a150] underline underline-offset-2 transition-colors">Terms of Service</Link>
            {" · "}
            <Link href="/responsible-gambling" className="text-[#12a150]/70 hover:text-[#12a150] underline underline-offset-2 transition-colors">Responsible Gambling</Link>
            {" · "}
            <span className="font-bold text-[#14161b]/46">Helpline: 1-800-522-4700</span>
          </p>
        </div>

        <div className="border-t border-[#14161b]/[.09] py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#14161b]/38">
            &copy; {new Date().getFullYear()} Edge Pro. All rights reserved.
          </p>
          <p className="text-[10px] text-[#14161b]/38">
            Not affiliated with Major League Baseball, the National Football League, the WNBA, or any team.
          </p>
        </div>
      </Container>
    </footer>
  );
}
