/**
 * Season status per sport — derived from today's date so the app flips between
 * "in season" and "offseason" automatically without a deploy.
 */

export type SportKey = "nba" | "nfl" | "soccer" | "mlb" | "wnba";

export interface SeasonInfo {
  key: SportKey;
  label: string;
  status: "in-season" | "offseason";
  /** Short chip text, e.g. "In Season" / "Offseason" */
  chip: string;
  /** One-liner describing where the sport is right now */
  detail: string;
  /** Next opening day (offseason only) */
  returns?: Date;
  returnsLabel?: string;
}

const MONTH = (d: Date) => d.getMonth() + 1; // 1-12

function nextOccurrence(month: number, day: number, from: Date): Date {
  const y = from.getFullYear();
  const candidate = new Date(y, month - 1, day);
  return candidate.getTime() > from.getTime() ? candidate : new Date(y + 1, month - 1, day);
}

export function getSeasonInfo(key: SportKey, now: Date = new Date()): SeasonInfo {
  const m = MONTH(now);
  const d = now.getDate();

  switch (key) {
    case "mlb": {
      // Opening Day late March → World Series ends ~Nov 5
      const inSeason = (m >= 4 && m <= 10) || (m === 3 && d >= 20) || (m === 11 && d <= 5);
      const returns = nextOccurrence(3, 26, now);
      return {
        key, label: "MLB", status: inSeason ? "in-season" : "offseason",
        chip: inSeason ? "In Season" : "Offseason",
        detail: inSeason ? "Regular season & postseason" : "The season is complete — see you on Opening Day",
        returns: inSeason ? undefined : returns,
        returnsLabel: inSeason ? undefined : `Opening Day · ${returns.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      };
    }
    case "wnba": {
      // May → Finals end late Oct
      const inSeason = m >= 5 && m <= 10;
      const returns = nextOccurrence(5, 15, now);
      return {
        key, label: "WNBA", status: inSeason ? "in-season" : "offseason",
        chip: inSeason ? "In Season" : "Offseason",
        detail: inSeason ? "Regular season & Finals" : "The season is complete — tip-off returns in May",
        returns: inSeason ? undefined : returns,
        returnsLabel: inSeason ? undefined : `Tip-off · ${returns.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      };
    }
    case "nba":
      return { key, label: "NBA", status: "in-season", chip: "Live Season", detail: "Regular season · Emirates NBA Cup in progress" };
    case "nfl":
      return { key, label: "NFL", status: "in-season", chip: "Live Season", detail: "Regular season · all 18 weeks on the board" };
    case "soccer":
      return { key, label: "Soccer", status: "in-season", chip: "Live Season", detail: "10 leagues · league play & European nights" };
  }
}

export function isOffseason(key: SportKey): boolean {
  return getSeasonInfo(key).status === "offseason";
}

export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86_400_000));
}

/** Current NBA season start year (2026-27 season → 2026). */
export function nbaSeasonStartYear(now: Date = new Date()): number {
  return now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

/** YYYYMMDD in US Eastern time (ESPN's scoreboards are keyed by ET dates). */
export function etDateStr(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" }).replace(/-/g, "");
}
