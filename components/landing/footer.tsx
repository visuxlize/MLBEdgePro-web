import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import { Container } from "./container";

function DiamondLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L4 10l10 16 10-16L14 2z" stroke="#FF7828" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,120,40,0.12)" />
      <path d="M4 10h20M14 2l-5 8h10L14 2z" stroke="#FF7828" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <DiamondLogo />
              <span className="text-[15px] font-bold text-white">
                MLB Edge<span className="text-[#FF7828]"> Pro</span>
              </span>
            </div>
            <p className="text-sm text-white/35 leading-relaxed max-w-xs">
              Data-driven MLB analysis for serious bettors. Free to start, lethal when Pro.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://github.com/visuxlize" target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-white transition-colors">
                <Github size={17} strokeWidth={1.6} />
              </a>
              <a href="#" className="text-white/25 hover:text-white transition-colors">
                <Twitter size={17} strokeWidth={1.6} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold text-white/30 tracking-widest uppercase mb-4">Product</p>
            <ul className="space-y-3">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "How it Works", href: "#how-it-works" },
                { label: "Download App", href: "/download" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/40 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold text-white/30 tracking-widest uppercase mb-4">Legal</p>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/40 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-7 border-t border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} MLB Edge Pro. All rights reserved.
          </p>
          <p className="text-xs text-white/15 max-w-sm text-right">
            For educational &amp; entertainment purposes only. Not financial or betting advice.
          </p>
        </div>
      </Container>
    </footer>
  );
}
