import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { LogoPlate, HeadshotPlate, SectionLabel } from "@/components/web-tool/spotlight";
import { gradeColor } from "@/lib/mlb/spotlight-utils";
import { getImpactStats } from "@/lib/wnba/impact";
import { getSchedule } from "@/lib/wnba/espn";
import { getPlayerProps } from "@/lib/wnba/sportsblaze";
import { wnbaTeamHex, wnbaLogoUrl, wnbaHeadshotUrl } from "@/lib/wnba/teams";

const ZONE_COLOR: Record<string, string> = {
  Paint: "#34d399",
  "Mid-range": "#fb923c",
  "3PT": "#a78bfa",
};

async function DailyPicks() {
  const [games, props] = await Promise.all([getSchedule(), getPlayerProps()]);
  const topGames = [...games].sort((a, b) => b.edge - a.edge).slice(0, 2);
  const topProps = [...props].sort((a, b) => b.edge - a.edge).slice(0, 2);

  if (topGames.length === 0 && topProps.length === 0) {
    return <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>No graded games today — check back on gameday.</p>;
  }

  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
      {topGames.map((g) => {
        const gc = gradeColor(g.grade);
        const fav = g.homeWinProb >= 50 ? g.home : g.away;
        return (
          <div key={g.id} className="flex items-center gap-3 rounded-[14px] px-4 py-3" style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
            <LogoPlate hex={wnbaTeamHex(fav)} src={wnbaLogoUrl(fav)} code={fav} size={34} radius={10} variant="clean" />
            <div className="flex-1 min-w-0">
              <p className="font-spot-sans font-extrabold text-sm" style={{ color: "var(--text)" }}>{fav} Moneyline</p>
              <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{g.away} @ {g.home}</p>
            </div>
            <span className="rounded-lg px-2 py-1 font-spot-sans font-black text-xs" style={{ color: gc, background: `color-mix(in srgb, ${gc} 16%, transparent)` }}>{g.grade}</span>
          </div>
        );
      })}
      {topProps.map((p) => {
        const gc = gradeColor(p.grade);
        return (
          <div key={p.id} className="flex items-center gap-3 rounded-[14px] px-4 py-3" style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
            <HeadshotPlate hex={wnbaTeamHex(p.team)} src={wnbaHeadshotUrl(p.espnId)} name={p.player} size={34} />
            <div className="flex-1 min-w-0">
              <p className="font-spot-sans font-extrabold text-sm" style={{ color: "var(--text)" }}>{p.player} &middot; {p.market} {p.over ? "OVER" : "UNDER"}</p>
              <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>Line {p.line} &middot; model {p.model}</p>
            </div>
            <span className="rounded-lg px-2 py-1 font-spot-sans font-black text-xs" style={{ color: gc, background: `color-mix(in srgb, ${gc} 16%, transparent)` }}>{p.grade}</span>
          </div>
        );
      })}
    </div>
  );
}

async function ImpactGrid() {
  const stats = await getImpactStats();
  return (
    <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" }}>
      {stats.map((s) => {
        const gc = gradeColor(s.grade);
        return (
          <div key={s.player} className="rounded-[18px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: `linear-gradient(120deg, ${wnbaTeamHex(s.team)}22, transparent 70%)` }}>
              <div className="relative shrink-0">
                <HeadshotPlate hex={wnbaTeamHex(s.team)} src={wnbaHeadshotUrl(s.espnId)} name={s.player} size={48} />
                <div className="absolute -bottom-1.5 -right-1.5">
                  <LogoPlate hex={wnbaTeamHex(s.team)} src={wnbaLogoUrl(s.team)} code={s.team} size={20} radius={6} variant="clean" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-spot-sans font-black text-base" style={{ color: "var(--text)" }}>{s.player}</p>
                <p className="mt-0.5 font-spot-sans font-semibold text-[10px]" style={{ color: "var(--text-3)" }}>{s.pos} &middot; {s.team}</p>
              </div>
              <span className="font-spot-sans font-black text-xl" style={{ color: gc }}>{s.grade}</span>
            </div>
            <div className="p-4 flex flex-col gap-3.5">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div>
                  <p className="font-spot-mono font-extrabold text-base" style={{ color: "var(--text)" }}>{s.usageRate}%</p>
                  <p className="font-spot-sans font-bold text-[9px] uppercase tracking-[.08em]" style={{ color: "var(--text-faint)" }}>Usage</p>
                </div>
                <div>
                  <p className="font-spot-mono font-extrabold text-base" style={{ color: "var(--text)" }}>{s.trueShooting}%</p>
                  <p className="font-spot-sans font-bold text-[9px] uppercase tracking-[.08em]" style={{ color: "var(--text-faint)" }}>True Shooting</p>
                </div>
                <div>
                  <p className="font-spot-mono font-extrabold text-base" style={{ color: s.plusMinus >= 0 ? "var(--green)" : "var(--red-soft)" }}>{s.plusMinus >= 0 ? "+" : ""}{s.plusMinus}</p>
                  <p className="font-spot-sans font-bold text-[9px] uppercase tracking-[.08em]" style={{ color: "var(--text-faint)" }}>Plus/Minus</p>
                </div>
              </div>
              <div>
                <p className="font-spot-sans font-bold text-[10px] uppercase tracking-[.08em] mb-1.5" style={{ color: "var(--text-faint)" }}>Shot Zone Split</p>
                <div className="flex h-2.5 rounded overflow-hidden" style={{ background: "rgba(255,255,255,.08)" }}>
                  {s.zones.map((z, zi) => (
                    <div key={z.zone} style={{ width: `${z.pct}%`, background: ZONE_COLOR[z.zone] ?? "#818cf8", transformOrigin: "left", animation: `bar-grow .7s cubic-bezier(.22,1,.36,1) ${zi * 0.1}s both` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  {s.zones.map((z) => (
                    <span key={z.zone} className="font-spot-sans text-[9px]" style={{ color: "var(--text-muted)" }}>{z.zone} {z.pct}%</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WnbaImpactPage() {
  return (
    <PaywallGate
      requiredTier="pro"
      feature="WNBA Player Impact Deep Dive"
      benefits={[
        "Usage rate & true shooting for every star",
        "Plus-minus impact scoring",
        "Shot-zone breakdown by player",
        "Daily Picks — the model's highest-graded plays",
      ]}
    >
      <div className="spotlight min-h-screen">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="mb-6">
            <SectionLabel style={{ color: "#2dd4bf" }}>Pro Deep Dive</SectionLabel>
            <h1 className="font-spot-sans text-3xl sm:text-4xl font-black leading-tight mt-1" style={{ color: "var(--text)" }}>Player Impact Deep Dive</h1>
            <p className="mt-1.5 font-spot-sans text-[13px]" style={{ color: "var(--text-muted)" }}>
              Usage, efficiency, and shot-zone splits for the players moving win probability.
            </p>
          </div>

          <div className="mb-8">
            <SectionLabel className="mb-3" style={{ color: "var(--text-faint)" }}>Daily Picks</SectionLabel>
            <DailyPicks />
          </div>

          <SectionLabel className="mb-3" style={{ color: "var(--text-faint)" }}>Player Impact</SectionLabel>
          <ImpactGrid />
        </div>
      </div>
    </PaywallGate>
  );
}
