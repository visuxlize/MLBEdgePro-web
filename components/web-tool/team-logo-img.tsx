"use client";

import { useState } from "react";
import { teamLogoUrl, teamLogoDarkUrl, TEAM_COLORS, TEAM_ABBR } from "@/lib/mlb/api";

interface Props {
  teamId: number;
  name: string;
  size?: number;
  /** Show logo on a white circular badge (recommended on dark backgrounds) */
  badge?: boolean;
}

export function TeamLogoImg({ teamId, name, size = 40, badge = false }: Props) {
  const [src, setSrc] = useState<"primary" | "dark" | "fallback">("primary");

  const abbr  = TEAM_ABBR[teamId] ?? name.split(" ").pop()?.slice(0, 3).toUpperCase() ?? "MLB";
  const color = TEAM_COLORS[teamId] ?? "#FF7828";

  if (src === "fallback") {
    return (
      <div
        className="rounded-full flex items-center justify-center font-black shrink-0"
        style={{
          width: size,
          height: size,
          backgroundColor: `${color}22`,
          border: `1.5px solid ${color}40`,
          color,
          fontSize: Math.max(8, size * 0.3),
          letterSpacing: "-0.5px",
        }}
      >
        {abbr.slice(0, 3)}
      </div>
    );
  }

  const imgSrc = src === "primary" ? teamLogoUrl(teamId) : teamLogoDarkUrl(teamId);

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={name}
      width={size}
      height={size}
      style={{
        width:  size,
        height: size,
        objectFit: "contain",
        display: "block",
        // Drop shadow makes any logo pop off any background
        filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
      }}
      onError={() => {
        if (src === "primary") setSrc("dark");
        else setSrc("fallback");
      }}
    />
  );

  if (badge) {
    const pad = Math.round(size * 0.15);
    return (
      <div
        className="rounded-full shrink-0 flex items-center justify-center"
        style={{
          width:  size + pad * 2,
          height: size + pad * 2,
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)",
          padding: pad,
        }}
      >
        {img}
      </div>
    );
  }

  return img;
}
