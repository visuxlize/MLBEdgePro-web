"use client";

export function GameTimeBadge({
  gameDate,
  isLive,
  isFinal,
}: {
  gameDate: string;
  isLive: boolean;
  isFinal: boolean;
}) {
  const gameTime = isLive
    ? "LIVE"
    : isFinal
    ? "Final"
    : new Date(gameDate).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

  return (
    <span
      className={`text-xs font-bold px-3 py-1.5 rounded-full border backdrop-blur-sm ${
        isLive
          ? "bg-red-500/20 border-red-500/30 text-red-400"
          : isFinal
          ? "bg-white/10 border-white/15 text-white/50"
          : "bg-[#FF7828]/20 border-[#FF7828]/30 text-[#FF7828]"
      }`}
    >
      {isLive && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse mr-1.5" />
      )}
      {gameTime}
    </span>
  );
}
