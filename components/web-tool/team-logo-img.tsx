"use client";

import { useState } from "react";
import { teamLogoUrl } from "@/lib/mlb/api";

export function TeamLogoImg({
  teamId,
  name,
  size = 40,
}: {
  teamId: number;
  name: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    // Fallback: first two letters of team name
    return (
      <div
        className="rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-bold"
        style={{ width: size, height: size, fontSize: size * 0.32 }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={teamLogoUrl(teamId)}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
      onError={() => setErrored(true)}
    />
  );
}
