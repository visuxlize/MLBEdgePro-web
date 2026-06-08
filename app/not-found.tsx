import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#FF7828]/[0.04] blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#818cf8]/[0.03] blur-[100px]" />

      <div className="relative z-10 text-center max-w-md w-full px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7828]/25 bg-[#FF7828]/[0.08] px-4 py-1.5 mb-8 shrink-0">
          <Zap size={11} className="text-[#FF7828] shrink-0" strokeWidth={2.5} />
          <span className="text-xs font-bold text-[#FF7828] tracking-wider uppercase whitespace-nowrap">MLB Edge Pro</span>
        </div>

        {/* 404 */}
        <h1 className="text-[120px] font-black text-white/[0.06] leading-none tracking-tighter select-none">
          404
        </h1>
        <div className="-mt-6 mb-4">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Page not found
          </h2>
          <p className="mt-3 text-white/40 text-sm leading-relaxed">
            This page doesn&apos;t exist or may have been moved.
            <br />
            Head back to the app to keep your edge.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link href="/games" className="shrink-0">
            <Button className="h-11 px-6 rounded-full bg-[#FF7828] hover:bg-[#FFA550] text-white font-bold gap-2 shadow-[0_8px_24px_rgba(255,120,40,0.35)] whitespace-nowrap">
              <Zap size={14} strokeWidth={2.5} />
              Go to App
            </Button>
          </Link>
          <Link href="/" className="shrink-0">
            <Button
              variant="ghost"
              className="h-11 px-5 rounded-full text-white/40 hover:text-white hover:bg-white/5 font-medium gap-2 whitespace-nowrap"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
