"use client";

import { useEffect } from "react";
import { settlePendingSlips } from "@/lib/slip-settle";

/** Quietly settles saved slips as games finish — on load, every few minutes, and when the tab regains focus. */
export function SlipSettler() {
  useEffect(() => {
    settlePendingSlips();
    const t = setInterval(() => settlePendingSlips(), 5 * 60_000);
    const vis = () => document.visibilityState === "visible" && settlePendingSlips();
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, []);
  return null;
}
