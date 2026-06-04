"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { Menu, X, ChevronRight, Zap } from "lucide-react";
import { Container } from "./container";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features",    href: "#features"    },
  { label: "How it Works",href: "#how-it-works" },
  { label: "Pricing",     href: "#pricing"      },
  { label: "Results",     href: "/results"      },
  { label: "Download",    href: "/download"     },
];

function DiamondLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M14 2L4 10l10 16 10-16L14 2z"
        stroke="#FF7828"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="rgba(255,120,40,0.12)"
      />
      <path d="M4 10h20M14 2l-5 8h10L14 2z" stroke="#FF7828" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function Header() {
  const { isSignedIn } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-background/90 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <DiamondLogo />
          <span className="text-[17px] font-bold tracking-tight text-white">
            MLB Edge<span className="text-[#FF7828]"> Pro</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/45 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <Link href="/games">
              <Button size="sm" className="rounded-full bg-[#FF7828] hover:bg-[#FFA550] text-white gap-1.5">
                <Zap size={13} strokeWidth={2} />
                Open App
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="rounded-full text-white/60 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="rounded-full bg-[#FF7828] hover:bg-[#FFA550] text-white gap-1.5">
                  Get Started Free
                  <ChevronRight size={13} strokeWidth={2.5} />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white/60 hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/[0.06] bg-background overflow-hidden"
          >
            <Container className="py-5 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/60 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 flex flex-col gap-3">
                <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full">Sign In</Button>
                </Link>
                <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full rounded-full bg-[#FF7828] hover:bg-[#FFA550] text-white">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
