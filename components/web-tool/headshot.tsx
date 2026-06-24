"use client";

import { playerHeadshotUrl } from "@/lib/mlb/api";

const MASK_SM  = "radial-gradient(ellipse 82% 88% at 50% 26%, black 35%, transparent 100%)";
const MASK_MD  = "radial-gradient(ellipse 78% 82% at 50% 32%, black 42%, transparent 100%)";
const MASK_LG  = "radial-gradient(ellipse 80% 85% at 50% 32%, black 44%, transparent 100%)";

interface HeadshotProps {
  id: number;
  name: string;
  size?: number;
  /** "sm" (36–44px) | "md" (default, 64–88px) | "lg" (96px+) */
  variant?: "sm" | "md" | "lg";
  className?: string;
}

export function Headshot({ id, name, size = 80, variant = "md", className = "" }: HeadshotProps) {
  const mask = variant === "sm" ? MASK_SM : variant === "lg" ? MASK_LG : MASK_MD;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={playerHeadshotUrl(id)}
      alt={name}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{
        objectPosition: "top center",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}
