"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, RefreshCw, CircleDot,
  ArrowRight, Lock, Trophy, Star, Zap, TrendingUp,
  MapPin, Clock, ChevronDown, BarChart3, Users, Target,
} from "lucide-react";
import { gameStatusLabel, getScore, getStadiumImageUrl, playerHeadshotUrl, teamLogoUrl, TEAM_ABBR, TEAM_COLORS, type Game } from "@/lib/mlb/api";
import { TeamLogoImg } from "@/components/web-tool/team-logo-img";
import { useSubscription } from "@/lib/subscription";

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(d: string, n: number) {
  const dt = new Date(d + "T12:00:00"); dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}
function labelFor(d: string) {
  const today = todayStr();
  if (d === today) return "Today";
  if (d === addDays(today, -1)) return "Yesterday";
  if (d === addDays(today, 1)) return "Tomorrow";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

async function fetchGames(date: string): Promise<Game[]> {
  const res = await fetch(`/api/mlb/schedule?date=${date}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchTeamNextGame(teamId: number, fromDate: string, days = 14): Promise<Game | null> {
  const endDate = addDays(fromDate, days);
  const res = await fetch(`/api/mlb/schedule?teamId=${teamId}&startDate=${fromDate}&endDate=${endDate}`);
  if (!res.ok) return null;
  const games: Game[] = await res.json();
  return games.find((g) => g.status.abstractGameState !== "Final") ?? games[0] ?? null;
}

// ── Date Strip ─────────────────────────────────────────────────────────────────

function DateStrip({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(date, i - 3));
  return (
    <div className="flex items-center gap-1.5 mb-5">
      <button onClick={() => onChange(addDays(date, -1))}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.07] transition-colors shrink-0">
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar flex-1">
        {days.map((d) => {
          const active = d === date;
          const dt = new Date(d + "T12:00:00");
          return (
            <button key={d} onClick={() => onChange(d)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-xs shrink-0 transition-all ${
                active ? "bg-[#FF7828] text-white" : "text-white/35 hover:text-white hover:bg-white/[0.06]"
              }`}>
              <span className="text-[9px] font-bold uppercase">{dt.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="text-sm font-black">{dt.getDate()}</span>
            </button>
          );
        })}
      </div>
      <button onClick={() => onChange(addDays(date, 1))}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.07] transition-colors shrink-0">
        <ChevronRight size={16} strokeWidth={2} />
      </button>
      {date !== todayStr() && (
        <button onClick={() => onChange(todayStr())}
          className="text-xs font-bold text-[#FF7828] hover:text-[#FFA550] transition-colors shrink-0 ml-1 whitespace-nowrap">
          Today
        </button>
      )}
    </div>
  );
}

// ── Compact Game Card ──────────────────────────────────────────────────────────

function GameCard({ game, favTeamId, onClick }: { game: Game; favTeamId: number | null; onClick: () => void }) {
  const away = game.teams.away;
  const home = game.teams.home;
  const isLive = game.status.detailedState === "In Progress";
  const isFinal = ["Final", "Game Over"].includes(game.status.detailedState);
  const awayScore = getScore(away, game.linescore, "away");
  const homeScore = getScore(home, game.linescore, "home");
  const awayWin = isFinal && awayScore !== undefined && homeScore !== undefined && awayScore > homeScore;
  const homeWin = isFinal && awayScore !== undefined && homeScore !== undefined && homeScore > awayScore;
  const isFavGame = favTeamId && (away.team.id === favTeamId || home.team.id === favTeamId);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 3 }}
      className={`w-full rounded-2xl border text-left transition-all overflow-hidden ${
        isFavGame
          ? "border-[#FF7828]/30 bg-gradient-to-r from-[#FF7828]/[0.06] to-[#0D1117]"
          : "border-white/[0.07] bg-[#0D1117] hover:border-white/[0.14] hover:bg-[#111622]"
      }`}
    >
      <div className="px-4 py-3.5 flex items-center gap-3">
        {/* Status / Time — prominent left column */}
        <div className="w-[72px] shrink-0 text-center">
          {isLive ? (
            <div className="flex flex-col items-center gap-0.5">
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-[10px] font-black text-red-400">LIVE</span>
              </motion.div>
              <span className="text-[10px] text-red-300/70">{game.linescore?.currentInningOrdinal ?? ""}</span>
            </div>
          ) : isFinal ? (
            <span className="text-[10px] font-bold text-white/25 uppercase">Final</span>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-white leading-tight">
                {new Date(game.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
              <span className="text-[9px] text-white/35 font-medium">
                {new Date(game.gameDate).toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ").pop()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          {/* Away */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="shrink-0"><TeamLogoImg teamId={away.team.id} name={away.team.name} size={30} /></div>
            <div className="min-w-0">
              <p className={`text-sm font-black truncate leading-tight ${awayWin ? "text-white" : isFinal ? "text-white/40" : "text-white"}`}>
                {TEAM_ABBR[away.team.id] ?? away.team.name.split(" ").pop()}
              </p>
              {away.probablePitcher && (
                <p className="text-[10px] text-white/30 truncate leading-tight">{away.probablePitcher.fullName.split(" ").pop()}</p>
              )}
            </div>
          </div>

          {/* Score / separator */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(isLive || isFinal) && awayScore !== undefined ? (
              <>
                <span className={`text-xl font-black tabular-nums ${awayWin ? "text-white" : "text-white/45"}`}>{awayScore}</span>
                <span className="text-white/15 text-sm">-</span>
                <span className={`text-xl font-black tabular-nums ${homeWin ? "text-white" : "text-white/45"}`}>{homeScore}</span>
              </>
            ) : (
              <span className="text-[10px] text-white/20 font-bold px-1">@</span>
            )}
          </div>

          {/* Home */}
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
            <div className="shrink-0"><TeamLogoImg teamId={home.team.id} name={home.team.name} size={30} /></div>
            <div className="min-w-0 text-right">
              <p className={`text-sm font-black truncate leading-tight ${homeWin ? "text-white" : isFinal ? "text-white/40" : "text-white"}`}>
                {TEAM_ABBR[home.team.id] ?? home.team.name.split(" ").pop()}
              </p>
              {home.probablePitcher && (
                <p className="text-[10px] text-white/30 truncate leading-tight">{home.probablePitcher.fullName.split(" ").pop()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={13} className="text-white/15 shrink-0" strokeWidth={2} />
      </div>

      {isFavGame && (
        <div className="px-4 pb-2 flex items-center gap-1">
          <Star size={9} className="text-[#FF7828]" fill="currentColor" />
          <span className="text-[9px] font-bold text-[#FF7828]/70">Your team</span>
        </div>
      )}
    </motion.button>
  );
}

// ── Set Favorite Team Prompt ───────────────────────────────────────────────────

const ALL_TEAMS_MINI = [
  { id: 108, name: "Angels", abbr: "LAA" }, { id: 109, name: "D-backs", abbr: "ARI" },
  { id: 110, name: "Orioles", abbr: "BAL" }, { id: 111, name: "Red Sox", abbr: "BOS" },
  { id: 112, name: "Cubs", abbr: "CHC" }, { id: 113, name: "Reds", abbr: "CIN" },
  { id: 114, name: "Guardians", abbr: "CLE" }, { id: 115, name: "Rockies", abbr: "COL" },
  { id: 116, name: "Tigers", abbr: "DET" }, { id: 117, name: "Astros", abbr: "HOU" },
  { id: 118, name: "Royals", abbr: "KC" }, { id: 119, name: "Dodgers", abbr: "LAD" },
  { id: 120, name: "Nationals", abbr: "WSH" }, { id: 121, name: "Mets", abbr: "NYM" },
  { id: 133, name: "Athletics", abbr: "OAK" }, { id: 134, name: "Pirates", abbr: "PIT" },
  { id: 135, name: "Padres", abbr: "SD" }, { id: 136, name: "Mariners", abbr: "SEA" },
  { id: 137, name: "Giants", abbr: "SF" }, { id: 138, name: "Cardinals", abbr: "STL" },
  { id: 139, name: "Rays", abbr: "TB" }, { id: 140, name: "Rangers", abbr: "TEX" },
  { id: 141, name: "Blue Jays", abbr: "TOR" }, { id: 142, name: "Twins", abbr: "MIN" },
  { id: 143, name: "Phillies", abbr: "PHI" }, { id: 144, name: "Braves", abbr: "ATL" },
  { id: 145, name: "White Sox", abbr: "CWS" }, { id: 146, name: "Marlins", abbr: "MIA" },
  { id: 147, name: "Yankees", abbr: "NYY" }, { id: 158, name: "Brewers", abbr: "MIL" },
];

function SetFavoriteTeamPrompt({ onSelect }: { onSelect: (id: number) => void }) {
  return (
    <div className="rounded-2xl border border-[#FF7828]/20 bg-gradient-to-b from-[#FF7828]/[0.06] to-transparent p-5">
      <div className="flex items-center gap-2 mb-4">
        <Star size={14} className="text-[#FF7828]" strokeWidth={2.5} />
        <p className="text-sm font-black text-white">Pick your team</p>
      </div>
      <p className="text-xs text-white/40 mb-4 leading-relaxed">
        Choose your favorite team to see their next game, probable pitchers, and matchup analysis right here.
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {ALL_TEAMS_MINI.map((t) => (
          <button key={t.id} onClick={() => onSelect(t.id)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-white/[0.06] transition-colors group">
            <TeamLogoImg teamId={t.id} name={t.name} size={24} />
            <span className="text-[8px] text-white/35 group-hover:text-white/60 font-bold transition-colors">{t.abbr}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Win Probability Bar ────────────────────────────────────────────────────────

function WinProbBar({ homeTeamId, awayTeamId, homeProb }: { homeTeamId: number; awayTeamId: number; homeProb: number }) {
  const awayProb = 100 - homeProb;
  const homeName = TEAM_ABBR[homeTeamId] ?? "Home";
  const awayName = TEAM_ABBR[awayTeamId] ?? "Away";
  return (
    <div className="space-y-2">
      <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Win Probability</p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-white/60 w-8 text-right">{awayProb}%</span>
        <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-white/[0.05] flex">
          <motion.div className="h-full rounded-l-full bg-[#60B4F0]"
            initial={{ width: 0 }} animate={{ width: `${awayProb}%` }} transition={{ duration: 0.8 }} />
          <motion.div className="h-full rounded-r-full bg-[#FF7828]"
            initial={{ width: 0 }} animate={{ width: `${homeProb}%` }} transition={{ duration: 0.8 }} />
        </div>
        <span className="text-[10px] font-black text-white/60 w-8">{homeProb}%</span>
      </div>
      <div className="flex justify-between text-[9px] text-white/30">
        <span>{awayName}</span>
        <span>{homeName}</span>
      </div>
    </div>
  );
}

// ── Favorite Team Panel ────────────────────────────────────────────────────────

function FavoriteTeamPanel({
  teamId, todayGames, date,
}: {
  teamId: number;
  todayGames: Game[];
  date: string;
}) {
  const router = useRouter();
  const [nextGame, setNextGame] = useState<Game | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  const teamName = ALL_TEAMS_MINI.find((t) => t.id === teamId)?.name ?? "Your Team";
  const teamColor = TEAM_COLORS[teamId] ?? "#FF7828";

  // Find today's game for this team
  const todayGame = todayGames.find(
    (g) => g.teams.away.team.id === teamId || g.teams.home.team.id === teamId
  ) ?? null;

  // If no game today, fetch next game
  useEffect(() => {
    if (todayGame) { setNextGame(null); return; }
    setLoadingNext(true);
    fetchTeamNextGame(teamId, addDays(date, 1))
      .then(setNextGame)
      .catch(() => setNextGame(null))
      .finally(() => setLoadingNext(false));
  }, [teamId, date, todayGame]);

  const featuredGame = todayGame ?? nextGame;
  if (!featuredGame && loadingNext) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-[#0D1117] p-5 animate-pulse h-48" />
    );
  }

  const isHome = featuredGame?.teams.home.team.id === teamId;
  const opponent = featuredGame
    ? (isHome ? featuredGame.teams.away : featuredGame.teams.home)
    : null;
  const myTeamData = featuredGame
    ? (isHome ? featuredGame.teams.home : featuredGame.teams.away)
    : null;
  const isLive = featuredGame?.status.detailedState === "In Progress";
  const isFinal = featuredGame && ["Final", "Game Over"].includes(featuredGame.status.detailedState);

  const myScore = featuredGame && myTeamData
    ? getScore(myTeamData, featuredGame.linescore, isHome ? "home" : "away") : null;
  const oppScore = featuredGame && opponent
    ? getScore(opponent, featuredGame.linescore, isHome ? "away" : "home") : null;

  // Simple win probability (ERA-based heuristic)
  const myERA = myTeamData?.probablePitcher ? 4.2 : 4.5;
  const oppERA = opponent?.probablePitcher ? 4.2 : 4.5;
  const homeAdv = isHome ? 3 : 0;
  const rawProb = Math.round(50 + (oppERA - myERA) * 8 + homeAdv);
  const myWinProb = Math.max(30, Math.min(70, rawProb));

  const stadiumUrl = featuredGame ? getStadiumImageUrl(featuredGame.venue.id) : "";

  return (
    <div className="space-y-3">
      {/* Team Header */}
      <div className="flex items-center gap-3 px-1">
        <TeamLogoImg teamId={teamId} name={teamName} size={36} badge />
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Your Team</p>
          <p className="text-lg font-black text-white">{teamName}</p>
        </div>
        <Link href="/settings" className="ml-auto text-[9px] text-white/25 hover:text-white/50 transition-colors">
          Change
        </Link>
      </div>

      {/* Game Card */}
      {featuredGame ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border overflow-hidden cursor-pointer group"
          style={{ borderColor: `${teamColor}25` }}
          onClick={() => router.push(`/game/${featuredGame.gamePk}`)}
        >
          {/* Stadium hero */}
          <div className="relative h-28 overflow-hidden">
            {stadiumUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stadiumUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${teamColor}30, #0D1117)` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/50 to-transparent" />

            {/* Status badge */}
            <div className="absolute top-3 left-3">
              {isLive ? (
                <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  className="flex items-center gap-1.5 text-[10px] font-black text-red-400 bg-red-500/20 border border-red-500/30 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />LIVE
                </motion.span>
              ) : isFinal ? (
                <span className="text-[10px] font-bold text-white/40 bg-white/[0.08] rounded-full px-2.5 py-1">FINAL</span>
              ) : (
                <span className="text-[10px] font-bold text-[#FF7828] bg-[#FF7828]/15 border border-[#FF7828]/25 rounded-full px-2.5 py-1">
                  {!todayGame ? `Next · ${new Date(featuredGame.gameDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Today"}
                </span>
              )}
            </div>

            {/* Venue */}
            <div className="absolute bottom-2 left-3 flex items-center gap-1">
              <MapPin size={9} className="text-white/30" strokeWidth={2} />
              <span className="text-[9px] text-white/30">{featuredGame.venue.name}</span>
            </div>
          </div>

          {/* Teams + score */}
          <div className="p-4 bg-[#0D1117]">
            <div className="flex items-center justify-between gap-4 mb-4">
              {/* My team */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <TeamLogoImg teamId={teamId} name={teamName} size={44} badge />
                <p className="text-sm font-black text-white">{TEAM_ABBR[teamId] ?? teamName}</p>
                {myTeamData?.probablePitcher && (
                  <p className="text-[10px] text-white/40 text-center leading-tight">
                    {myTeamData.probablePitcher.fullName}
                  </p>
                )}
                {(isLive || isFinal) && myScore !== null && (
                  <span className="text-3xl font-black text-white">{myScore}</span>
                )}
              </div>

              {/* Center */}
              <div className="flex flex-col items-center gap-1">
                {!isLive && !isFinal && (
                  <span className="text-lg font-black text-white leading-tight">
                    {new Date(featuredGame.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
                <span className="text-[10px] text-white/25 font-bold">{isHome ? "HOME" : "AWAY"}</span>
                <span className="text-white/20 font-black text-sm">vs</span>
              </div>

              {/* Opponent */}
              <div className="flex flex-col items-center gap-2 flex-1">
                {opponent && <TeamLogoImg teamId={opponent.team.id} name={opponent.team.name} size={44} badge />}
                <p className="text-sm font-black text-white/70">{opponent ? (TEAM_ABBR[opponent.team.id] ?? opponent.team.name.split(" ").pop()) : "TBD"}</p>
                {opponent?.probablePitcher && (
                  <p className="text-[10px] text-white/30 text-center leading-tight">
                    {opponent.probablePitcher.fullName}
                  </p>
                )}
                {(isLive || isFinal) && oppScore !== null && (
                  <span className="text-3xl font-black text-white/60">{oppScore}</span>
                )}
              </div>
            </div>

            {/* Win probability */}
            {!isFinal && opponent && (
              <WinProbBar
                homeTeamId={featuredGame.teams.home.team.id}
                awayTeamId={featuredGame.teams.away.team.id}
                homeProb={isHome ? myWinProb : 100 - myWinProb}
              />
            )}

            {/* CTA */}
            <Link
              href={`/game/${featuredGame.gamePk}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-xs font-black transition-colors"
              style={{ background: `${teamColor}15`, color: teamColor, border: `1px solid ${teamColor}30` }}
            >
              <BarChart3 size={12} strokeWidth={2.5} />
              View Full Analysis
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0D1117] p-5 text-center">
          <CircleDot size={28} className="text-white/15 mx-auto mb-2" strokeWidth={1.2} />
          <p className="text-sm text-white/30">No upcoming games found</p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { href: "/analysis", icon: TrendingUp, label: "Edge Report", color: "#50C882" },
          { href: "/props", icon: Target, label: "Prop Builder", color: "#818cf8" },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#0D1117] px-3 py-2.5 hover:border-white/[0.14] transition-colors">
            <Icon size={12} style={{ color }} strokeWidth={2.5} />
            <span className="text-xs font-bold text-white/60">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function GamesPage() {
  const router = useRouter();
  const { isLoaded: subscriptionLoaded, isSuperPro } = useSubscription();
  const [date, setDate] = useState(todayStr());
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [favTeamId, setFavTeamId] = useState<number | null>(null);
  const [upgradeBanner, setUpgradeBanner] = useState<string | null>(null);

  // Read favorite team from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("mlbedge_fav_team");
    if (stored) setFavTeamId(Number(stored));
  }, []);

  // Save favorite team to localStorage
  const handleSetFav = useCallback((id: number) => {
    localStorage.setItem("mlbedge_fav_team", String(id));
    setFavTeamId(id);
  }, []);

  // Upgrade banner
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      const tier = params.get("tier") ?? "fan";
      setUpgradeBanner(tier === "pro" ? "🎉 Welcome to Pro! Your full access is now unlocked." : "🎉 Welcome to Fan! Your features are now unlocked.");
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setUpgradeBanner(null), 6000);
    }
  }, []);

  // Fetch games via API proxy (avoids CSP issues)
  useEffect(() => {
    setLoading(true);
    fetchGames(date)
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [date]);

  // Navigate to game detail
  const handleGameClick = useCallback((gamePk: number) => {
    router.push(`/game/${gamePk}`);
  }, [router]);

  const live     = games.filter((g) => g.status.detailedState === "In Progress");
  const upcoming = games.filter((g) => g.status.abstractGameState === "Preview");
  const final    = games.filter((g) => ["Final", "Game Over"].includes(g.status.detailedState));

  const worldCupHref = isSuperPro ? "/worldcup" : "/upgrade?tier=pro";
  const worldCupSubtext = subscriptionLoaded && isSuperPro
    ? "PRO access unlocked — open the event hub."
    : "Included with Pro — FIFA World Cup analysis hub.";

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Upgrade banner */}
      <AnimatePresence>
        {upgradeBanner && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="mb-5 rounded-2xl border border-[#50C882]/30 bg-[#50C882]/10 px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-[#50C882]">{upgradeBanner}</p>
            <button onClick={() => setUpgradeBanner(null)} className="text-[#50C882]/50 hover:text-[#50C882] text-lg">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* World Cup Banner */}
      <Link href={worldCupHref} className="block mb-5">
        <div className="rounded-2xl border border-[#FBBF24]/25 bg-gradient-to-r from-[#FBBF24]/12 via-[#F59E0B]/8 to-[#0f172a] px-4 sm:px-5 py-3.5 hover:border-[#FBBF24]/45 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl border border-[#FBBF24]/35 bg-[#FBBF24]/12 flex items-center justify-center shrink-0">
                <Trophy size={14} className="text-[#FBBF24]" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[11px] font-black tracking-wide text-[#FBBF24] uppercase">Limited Time — FIFA World Cup 2026 Analysis</p>
                <p className="text-[10px] text-white/45 mt-0.5">{worldCupSubtext}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#FBBF24] shrink-0">
              {!isSuperPro && <Lock size={12} strokeWidth={2.4} />}
              <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </Link>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: Games list ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Schedule</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {labelFor(date)}
                {date === todayStr() && (
                  <span className="ml-3 text-sm font-normal text-white/25">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                )}
              </h1>
            </div>
            {!loading && games.length > 0 && (
              <div className="flex items-center gap-3 text-xs text-white/25">
                {live.length > 0 && (
                  <span className="flex items-center gap-1.5 text-red-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />{live.length} live
                  </span>
                )}
                <span>{games.length} games</span>
              </div>
            )}
          </div>

          {/* Date strip */}
          <DateStrip date={date} onChange={setDate} />

          {/* Game list */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-[70px] rounded-2xl bg-white/[0.03] animate-pulse" style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </motion.div>
            ) : games.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center py-20 text-center">
                <CircleDot size={44} className="text-white/10 mb-4" strokeWidth={1.2} />
                <p className="text-white/35 text-sm">No games scheduled for {labelFor(date)}</p>
                <button onClick={() => setDate(todayStr())} className="mt-4 text-xs font-bold text-[#FF7828] hover:text-[#FFA550] transition-colors">
                  Go to today
                </button>
              </motion.div>
            ) : (
              <motion.div key={date} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                className="space-y-5">
                {/* Live games */}
                {live.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-red-400/70 tracking-widest uppercase mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Live Now — {live.length}
                    </p>
                    <div className="space-y-1.5">
                      {live.map((g) => (
                        <GameCard key={g.gamePk} game={g} favTeamId={favTeamId} onClick={() => handleGameClick(g.gamePk)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-white/25 tracking-widest uppercase mb-2">
                      Upcoming — {upcoming.length}
                    </p>
                    <div className="space-y-1.5">
                      {upcoming.map((g) => (
                        <GameCard key={g.gamePk} game={g} favTeamId={favTeamId} onClick={() => handleGameClick(g.gamePk)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Final */}
                {final.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-white/20 tracking-widest uppercase mb-2">Final — {final.length}</p>
                    <div className="space-y-1.5">
                      {final.map((g) => (
                        <GameCard key={g.gamePk} game={g} favTeamId={favTeamId} onClick={() => handleGameClick(g.gamePk)} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-[10px] text-white/12">Data updates automatically throughout the day.</p>
        </div>

        {/* ── RIGHT: Favorite team panel ───────────────────────────────────── */}
        <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0">
          {favTeamId ? (
            <FavoriteTeamPanel teamId={favTeamId} todayGames={games} date={date} />
          ) : (
            <SetFavoriteTeamPrompt onSelect={handleSetFav} />
          )}
        </div>
      </div>
    </div>
  );
}
