"use client";

import { usePathname } from "next/navigation";
import { getSeasonInfo } from "@/lib/season";
import { OffseasonHub } from "@/components/web-tool/offseason-hub";

/** Landing screens for sports that are out of season — everything else (past game pages, settings…) renders normally. */
const GUARDED: { sport: "mlb" | "wnba"; paths: string[] }[] = [
  { sport: "mlb", paths: ["/games", "/scores", "/props", "/hr-deep-dive", "/analysis"] },
  { sport: "wnba", paths: ["/wnba", "/wnba/props", "/wnba/impact"] },
];

export function OffseasonGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hit = GUARDED.find((g) => g.paths.includes(pathname));
  if (hit && getSeasonInfo(hit.sport).status === "offseason") {
    return <main className="flex-1 w-full"><OffseasonHub sport={hit.sport} /></main>;
  }
  return <>{children}</>;
}
