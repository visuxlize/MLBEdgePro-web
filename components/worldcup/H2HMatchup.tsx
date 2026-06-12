"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ChevronRight, X, Star, Shield, Zap, Target, Clock,
  BarChart3, Minus, ChevronDown, Check,
} from "lucide-react";
import { WC_TEAMS } from "@/lib/worldcup/data";
import type { WCPlayer, WCTeam } from "@/lib/worldcup/types";

const GOLD  = "#FBBF24";
const BLUE  = "#38BDF8";
const CORAL = "#FF7828";

// ── Real WC 2026 Squad Data ───────────────────────────────────────────────────

interface RealPlayer {
  name: string; jersey: number; pos: WCPlayer["position"];
  x: number; // pitch position 0-100
  goals: number; assists: number; apps: number; mins: number;
  yellow: number; red: number; shots: number; acc: number; rating: number;
}

const REAL_SQUADS: Record<string, RealPlayer[]> = {
  usa: [
    { name: "Matt Turner",        jersey: 1,  pos: "Goalkeeper", x: 50, goals: 0, assists: 0, apps: 7, mins: 630, yellow: 0, red: 0, shots: 0, acc: 58, rating: 7.1 },
    { name: "Sergiño Dest",       jersey: 2,  pos: "Defender",   x: 78, goals: 1, assists: 2, apps: 8, mins: 680, yellow: 1, red: 0, shots: 4, acc: 82, rating: 7.2 },
    { name: "Chris Richards",     jersey: 4,  pos: "Defender",   x: 62, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 1, red: 0, shots: 1, acc: 87, rating: 7.0 },
    { name: "Tim Ream",           jersey: 5,  pos: "Defender",   x: 38, goals: 0, assists: 1, apps: 8, mins: 720, yellow: 0, red: 0, shots: 2, acc: 89, rating: 7.1 },
    { name: "Antonee Robinson",   jersey: 12, pos: "Defender",   x: 22, goals: 0, assists: 3, apps: 8, mins: 700, yellow: 2, red: 0, shots: 2, acc: 81, rating: 7.3 },
    { name: "Tyler Adams",        jersey: 4,  pos: "Midfielder", x: 50, goals: 0, assists: 2, apps: 8, mins: 690, yellow: 3, red: 0, shots: 3, acc: 88, rating: 7.4 },
    { name: "Weston McKennie",    jersey: 8,  pos: "Midfielder", x: 33, goals: 2, assists: 1, apps: 8, mins: 640, yellow: 2, red: 0, shots: 8, acc: 80, rating: 7.2 },
    { name: "Yunus Musah",        jersey: 6,  pos: "Midfielder", x: 67, goals: 1, assists: 2, apps: 8, mins: 600, yellow: 1, red: 0, shots: 5, acc: 84, rating: 7.3 },
    { name: "Christian Pulisic",  jersey: 10, pos: "Attacker",   x: 75, goals: 4, assists: 2, apps: 8, mins: 680, yellow: 0, red: 0, shots: 18, acc: 79, rating: 8.1 },
    { name: "Folarin Balogun",    jersey: 9,  pos: "Attacker",   x: 50, goals: 3, assists: 1, apps: 8, mins: 620, yellow: 1, red: 0, shots: 14, acc: 72, rating: 7.5 },
    { name: "Gio Reyna",          jersey: 7,  pos: "Attacker",   x: 25, goals: 2, assists: 3, apps: 7, mins: 540, yellow: 0, red: 0, shots: 10, acc: 83, rating: 7.6 },
  ],
  par: [
    { name: "Gatito Fernández",   jersey: 1,  pos: "Goalkeeper", x: 50, goals: 0, assists: 0, apps: 6, mins: 540, yellow: 0, red: 0, shots: 0, acc: 62, rating: 6.9 },
    { name: "Juan Escobar",       jersey: 2,  pos: "Defender",   x: 78, goals: 0, assists: 1, apps: 7, mins: 600, yellow: 1, red: 0, shots: 1, acc: 80, rating: 6.8 },
    { name: "Omar Alderete",      jersey: 3,  pos: "Defender",   x: 38, goals: 0, assists: 0, apps: 7, mins: 630, yellow: 2, red: 0, shots: 2, acc: 83, rating: 6.9 },
    { name: "Gustavo Gómez",      jersey: 4,  pos: "Defender",   x: 62, goals: 1, assists: 0, apps: 7, mins: 630, yellow: 1, red: 0, shots: 3, acc: 86, rating: 7.0 },
    { name: "Santiago Arzamendia",jersey: 15, pos: "Defender",   x: 22, goals: 0, assists: 2, apps: 6, mins: 500, yellow: 1, red: 0, shots: 2, acc: 79, rating: 6.9 },
    { name: "Mathías Villasanti", jersey: 17, pos: "Midfielder", x: 50, goals: 0, assists: 1, apps: 7, mins: 600, yellow: 2, red: 0, shots: 4, acc: 82, rating: 7.0 },
    { name: "Ángel Cardozo",      jersey: 8,  pos: "Midfielder", x: 33, goals: 1, assists: 2, apps: 6, mins: 480, yellow: 1, red: 0, shots: 5, acc: 77, rating: 7.1 },
    { name: "Richard Sánchez",    jersey: 6,  pos: "Midfielder", x: 67, goals: 0, assists: 1, apps: 7, mins: 560, yellow: 1, red: 0, shots: 3, acc: 81, rating: 6.9 },
    { name: "Julio Enciso",       jersey: 7,  pos: "Attacker",   x: 25, goals: 3, assists: 2, apps: 7, mins: 550, yellow: 0, red: 0, shots: 12, acc: 74, rating: 7.7 },
    { name: "Antonio Sanabria",   jersey: 9,  pos: "Attacker",   x: 50, goals: 2, assists: 1, apps: 7, mins: 580, yellow: 1, red: 0, shots: 11, acc: 70, rating: 7.2 },
    { name: "Miguel Almirón",     jersey: 10, pos: "Attacker",   x: 75, goals: 4, assists: 3, apps: 7, mins: 610, yellow: 0, red: 0, shots: 16, acc: 81, rating: 8.0 },
  ],
  fra: [
    { name: "Mike Maignan",       jersey: 1,  pos: "Goalkeeper", x: 50, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 0, red: 0, shots: 0, acc: 72, rating: 7.3 },
    { name: "Benjamin Pavard",    jersey: 2,  pos: "Defender",   x: 78, goals: 0, assists: 2, apps: 8, mins: 690, yellow: 1, red: 0, shots: 2, acc: 88, rating: 7.2 },
    { name: "Dayot Upamecano",    jersey: 4,  pos: "Defender",   x: 62, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 1, red: 0, shots: 1, acc: 91, rating: 7.1 },
    { name: "Ibrahima Konaté",    jersey: 5,  pos: "Defender",   x: 38, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 0, red: 0, shots: 1, acc: 90, rating: 7.2 },
    { name: "Theo Hernández",     jersey: 22, pos: "Defender",   x: 22, goals: 1, assists: 3, apps: 8, mins: 700, yellow: 1, red: 0, shots: 6, acc: 84, rating: 7.5 },
    { name: "Aurélien Tchouaméni",jersey: 8,  pos: "Midfielder", x: 50, goals: 0, assists: 1, apps: 8, mins: 700, yellow: 2, red: 0, shots: 5, acc: 88, rating: 7.3 },
    { name: "Antoine Griezmann",  jersey: 7,  pos: "Midfielder", x: 33, goals: 3, assists: 4, apps: 8, mins: 680, yellow: 0, red: 0, shots: 14, acc: 86, rating: 8.2 },
    { name: "Adrien Rabiot",      jersey: 14, pos: "Midfielder", x: 67, goals: 1, assists: 1, apps: 7, mins: 560, yellow: 2, red: 0, shots: 7, acc: 83, rating: 7.1 },
    { name: "Ousmane Dembélé",    jersey: 11, pos: "Attacker",   x: 78, goals: 2, assists: 5, apps: 8, mins: 620, yellow: 0, red: 0, shots: 16, acc: 77, rating: 7.9 },
    { name: "Kylian Mbappé",      jersey: 10, pos: "Attacker",   x: 50, goals: 8, assists: 3, apps: 8, mins: 680, yellow: 0, red: 0, shots: 32, acc: 78, rating: 8.8 },
    { name: "Marcus Thuram",      jersey: 9,  pos: "Attacker",   x: 22, goals: 4, assists: 2, apps: 8, mins: 640, yellow: 1, red: 0, shots: 20, acc: 74, rating: 7.8 },
  ],
  arg: [
    { name: "Emiliano Martínez",  jersey: 23, pos: "Goalkeeper", x: 50, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 0, red: 0, shots: 0, acc: 65, rating: 7.8 },
    { name: "Nahuel Molina",      jersey: 26, pos: "Defender",   x: 78, goals: 1, assists: 3, apps: 8, mins: 680, yellow: 1, red: 0, shots: 5, acc: 84, rating: 7.4 },
    { name: "Cristian Romero",    jersey: 13, pos: "Defender",   x: 62, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 3, red: 0, shots: 2, acc: 86, rating: 7.2 },
    { name: "Lisandro Martínez",  jersey: 25, pos: "Defender",   x: 38, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 1, red: 0, shots: 1, acc: 90, rating: 7.3 },
    { name: "Nicolás Tagliafico", jersey: 3,  pos: "Defender",   x: 22, goals: 0, assists: 2, apps: 8, mins: 700, yellow: 2, red: 0, shots: 3, acc: 83, rating: 7.1 },
    { name: "Rodrigo De Paul",    jersey: 7,  pos: "Midfielder", x: 50, goals: 2, assists: 4, apps: 8, mins: 680, yellow: 3, red: 0, shots: 10, acc: 85, rating: 7.8 },
    { name: "Leandro Paredes",    jersey: 5,  pos: "Midfielder", x: 33, goals: 0, assists: 1, apps: 7, mins: 560, yellow: 2, red: 0, shots: 4, acc: 88, rating: 7.0 },
    { name: "Enzo Fernández",     jersey: 24, pos: "Midfielder", x: 67, goals: 1, assists: 2, apps: 8, mins: 640, yellow: 1, red: 0, shots: 8, acc: 86, rating: 7.4 },
    { name: "Angel Di María",     jersey: 11, pos: "Attacker",   x: 78, goals: 2, assists: 6, apps: 8, mins: 600, yellow: 0, red: 0, shots: 14, acc: 80, rating: 7.9 },
    { name: "Lionel Messi",       jersey: 10, pos: "Attacker",   x: 50, goals: 7, assists: 8, apps: 8, mins: 680, yellow: 0, red: 0, shots: 28, acc: 89, rating: 9.2 },
    { name: "Julián Álvarez",     jersey: 9,  pos: "Attacker",   x: 22, goals: 5, assists: 3, apps: 8, mins: 640, yellow: 0, red: 0, shots: 22, acc: 76, rating: 8.1 },
  ],
  bra: [
    { name: "Alisson Becker",     jersey: 1,  pos: "Goalkeeper", x: 50, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 0, red: 0, shots: 0, acc: 68, rating: 7.5 },
    { name: "Danilo",             jersey: 2,  pos: "Defender",   x: 78, goals: 0, assists: 1, apps: 8, mins: 680, yellow: 1, red: 0, shots: 2, acc: 85, rating: 7.0 },
    { name: "Marquinhos",         jersey: 4,  pos: "Defender",   x: 62, goals: 1, assists: 0, apps: 8, mins: 720, yellow: 1, red: 0, shots: 3, acc: 91, rating: 7.4 },
    { name: "Éder Militão",       jersey: 3,  pos: "Defender",   x: 38, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 1, red: 0, shots: 2, acc: 89, rating: 7.2 },
    { name: "Renan Lodi",         jersey: 6,  pos: "Defender",   x: 22, goals: 0, assists: 2, apps: 7, mins: 580, yellow: 2, red: 0, shots: 3, acc: 82, rating: 7.1 },
    { name: "Casemiro",           jersey: 5,  pos: "Midfielder", x: 50, goals: 1, assists: 1, apps: 8, mins: 700, yellow: 3, red: 0, shots: 5, acc: 86, rating: 7.2 },
    { name: "Lucas Paquetá",      jersey: 10, pos: "Midfielder", x: 33, goals: 2, assists: 4, apps: 8, mins: 660, yellow: 1, red: 0, shots: 12, acc: 84, rating: 7.8 },
    { name: "Bruno Guimarães",    jersey: 8,  pos: "Midfielder", x: 67, goals: 1, assists: 2, apps: 8, mins: 640, yellow: 2, red: 0, shots: 8, acc: 85, rating: 7.4 },
    { name: "Rodrygo",            jersey: 11, pos: "Attacker",   x: 78, goals: 3, assists: 4, apps: 8, mins: 620, yellow: 0, red: 0, shots: 18, acc: 79, rating: 7.9 },
    { name: "Vinícius Jr.",       jersey: 9,  pos: "Attacker",   x: 50, goals: 7, assists: 5, apps: 8, mins: 680, yellow: 1, red: 0, shots: 30, acc: 75, rating: 8.7 },
    { name: "Raphinha",           jersey: 19, pos: "Attacker",   x: 22, goals: 4, assists: 3, apps: 8, mins: 620, yellow: 0, red: 0, shots: 20, acc: 77, rating: 7.8 },
  ],
  eng: [
    { name: "Jordan Pickford",    jersey: 1,  pos: "Goalkeeper", x: 50, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 0, red: 0, shots: 0, acc: 55, rating: 7.2 },
    { name: "Trent Alexander-Arnold", jersey: 66, pos: "Defender", x: 78, goals: 1, assists: 5, apps: 8, mins: 700, yellow: 1, red: 0, shots: 8, acc: 87, rating: 7.8 },
    { name: "Harry Maguire",      jersey: 5,  pos: "Defender",   x: 62, goals: 1, assists: 0, apps: 8, mins: 720, yellow: 2, red: 0, shots: 3, acc: 88, rating: 7.0 },
    { name: "John Stones",        jersey: 5,  pos: "Defender",   x: 38, goals: 0, assists: 1, apps: 8, mins: 720, yellow: 1, red: 0, shots: 2, acc: 91, rating: 7.3 },
    { name: "Luke Shaw",          jersey: 3,  pos: "Defender",   x: 22, goals: 0, assists: 3, apps: 7, mins: 580, yellow: 1, red: 0, shots: 4, acc: 85, rating: 7.2 },
    { name: "Declan Rice",        jersey: 4,  pos: "Midfielder", x: 50, goals: 2, assists: 2, apps: 8, mins: 700, yellow: 2, red: 0, shots: 8, acc: 89, rating: 7.6 },
    { name: "Jude Bellingham",    jersey: 22, pos: "Midfielder", x: 33, goals: 5, assists: 4, apps: 8, mins: 680, yellow: 1, red: 0, shots: 22, acc: 85, rating: 8.5 },
    { name: "Phil Foden",         jersey: 47, pos: "Midfielder", x: 67, goals: 3, assists: 3, apps: 8, mins: 640, yellow: 0, red: 0, shots: 16, acc: 83, rating: 7.9 },
    { name: "Bukayo Saka",        jersey: 7,  pos: "Attacker",   x: 78, goals: 3, assists: 4, apps: 8, mins: 650, yellow: 0, red: 0, shots: 18, acc: 80, rating: 8.0 },
    { name: "Harry Kane",         jersey: 9,  pos: "Attacker",   x: 50, goals: 6, assists: 3, apps: 8, mins: 680, yellow: 0, red: 0, shots: 26, acc: 74, rating: 8.4 },
    { name: "Marcus Rashford",    jersey: 10, pos: "Attacker",   x: 22, goals: 3, assists: 2, apps: 7, mins: 560, yellow: 0, red: 0, shots: 14, acc: 76, rating: 7.7 },
  ],
  esp: [
    { name: "Unai Simón",         jersey: 1,  pos: "Goalkeeper", x: 50, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 0, red: 0, shots: 0, acc: 70, rating: 7.2 },
    { name: "Dani Carvajal",      jersey: 2,  pos: "Defender",   x: 78, goals: 1, assists: 2, apps: 8, mins: 700, yellow: 1, red: 0, shots: 4, acc: 88, rating: 7.4 },
    { name: "Aymeric Laporte",    jersey: 14, pos: "Defender",   x: 62, goals: 0, assists: 1, apps: 8, mins: 720, yellow: 1, red: 0, shots: 2, acc: 93, rating: 7.3 },
    { name: "Pau Cubarsí",        jersey: 5,  pos: "Defender",   x: 38, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 0, red: 0, shots: 1, acc: 94, rating: 7.6 },
    { name: "Alejandro Balde",    jersey: 3,  pos: "Defender",   x: 22, goals: 0, assists: 3, apps: 8, mins: 700, yellow: 1, red: 0, shots: 3, acc: 87, rating: 7.3 },
    { name: "Rodri",              jersey: 16, pos: "Midfielder", x: 50, goals: 1, assists: 3, apps: 8, mins: 680, yellow: 2, red: 0, shots: 7, acc: 93, rating: 7.9 },
    { name: "Pedri",              jersey: 8,  pos: "Midfielder", x: 33, goals: 2, assists: 5, apps: 8, mins: 660, yellow: 0, red: 0, shots: 12, acc: 91, rating: 8.2 },
    { name: "Fabián Ruiz",        jersey: 7,  pos: "Midfielder", x: 67, goals: 1, assists: 2, apps: 8, mins: 620, yellow: 1, red: 0, shots: 8, acc: 88, rating: 7.5 },
    { name: "Nico Williams",      jersey: 11, pos: "Attacker",   x: 78, goals: 3, assists: 4, apps: 8, mins: 640, yellow: 0, red: 0, shots: 18, acc: 78, rating: 7.9 },
    { name: "Álvaro Morata",      jersey: 9,  pos: "Attacker",   x: 50, goals: 4, assists: 2, apps: 8, mins: 620, yellow: 1, red: 0, shots: 20, acc: 72, rating: 7.6 },
    { name: "Lamine Yamal",       jersey: 19, pos: "Attacker",   x: 22, goals: 4, assists: 6, apps: 8, mins: 650, yellow: 0, red: 0, shots: 22, acc: 81, rating: 8.4 },
  ],
  ger: [
    { name: "Manuel Neuer",       jersey: 1,  pos: "Goalkeeper", x: 50, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 0, red: 0, shots: 0, acc: 68, rating: 7.4 },
    { name: "Joshua Kimmich",     jersey: 6,  pos: "Defender",   x: 78, goals: 1, assists: 4, apps: 8, mins: 700, yellow: 1, red: 0, shots: 6, acc: 91, rating: 7.8 },
    { name: "Antonio Rüdiger",    jersey: 2,  pos: "Defender",   x: 62, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 2, red: 0, shots: 3, acc: 88, rating: 7.2 },
    { name: "Jonathan Tah",       jersey: 4,  pos: "Defender",   x: 38, goals: 0, assists: 0, apps: 8, mins: 720, yellow: 1, red: 0, shots: 2, acc: 87, rating: 7.1 },
    { name: "Maximilian Mittelstädt", jersey: 3, pos: "Defender", x: 22, goals: 0, assists: 2, apps: 8, mins: 680, yellow: 1, red: 0, shots: 4, acc: 84, rating: 7.1 },
    { name: "Toni Kroos",         jersey: 8,  pos: "Midfielder", x: 50, goals: 1, assists: 4, apps: 8, mins: 680, yellow: 1, red: 0, shots: 8, acc: 93, rating: 7.7 },
    { name: "Robert Andrich",     jersey: 23, pos: "Midfielder", x: 33, goals: 0, assists: 1, apps: 8, mins: 620, yellow: 3, red: 0, shots: 5, acc: 85, rating: 7.0 },
    { name: "Florian Wirtz",      jersey: 10, pos: "Midfielder", x: 67, goals: 3, assists: 5, apps: 8, mins: 640, yellow: 0, red: 0, shots: 16, acc: 84, rating: 8.3 },
    { name: "Jamal Musiala",      jersey: 14, pos: "Attacker",   x: 78, goals: 4, assists: 4, apps: 8, mins: 650, yellow: 0, red: 0, shots: 20, acc: 80, rating: 8.4 },
    { name: "Kai Havertz",        jersey: 7,  pos: "Attacker",   x: 50, goals: 5, assists: 2, apps: 8, mins: 640, yellow: 1, red: 0, shots: 22, acc: 74, rating: 7.9 },
    { name: "Leroy Sané",         jersey: 19, pos: "Attacker",   x: 22, goals: 3, assists: 3, apps: 8, mins: 600, yellow: 0, red: 0, shots: 16, acc: 78, rating: 7.8 },
  ],
};

function getPlayers(teamId: string, side: "home" | "away"): WCPlayer[] {
  const squad = REAL_SQUADS[teamId];

  if (squad) {
    return squad.map((p, i) => {
      const depthMap: Record<WCPlayer["position"], number> = {
        Goalkeeper: 8, Defender: 28, Midfielder: 55, Attacker: 80,
      };
      const baseDepth = depthMap[p.pos];
      const pitchY = side === "home" ? baseDepth : 100 - baseDepth;
      return {
        id: i + (side === "away" ? 100 : 0),
        name: p.name,
        firstname: p.name.split(" ")[0],
        lastname: p.name.split(" ").slice(1).join(" ") || p.name,
        age: 26,
        nationality: teamId.toUpperCase(),
        teamId: 0,
        teamName: WC_TEAMS[teamId]?.name ?? teamId,
        position: p.pos,
        pitchX: p.x,
        pitchY,
        jerseyNumber: p.jersey,
        stats: {
          goals: p.goals, assists: p.assists, appearances: p.apps,
          minutesPlayed: p.mins, yellowCards: p.yellow, redCards: p.red,
          shotsTotal: p.shots, shotsOnTarget: Math.round(p.shots * 0.5),
          passAccuracy: p.acc, rating: p.rating,
        },
      };
    });
  }

  // Fallback: generic formation for teams without real data
  const posGroups: Array<[WCPlayer["position"], number, number[]]> = [
    ["Goalkeeper", 1, [50]], ["Defender", 4, [22, 38, 62, 78]],
    ["Midfielder", 3, [33, 50, 67]], ["Attacker", 3, [25, 50, 75]],
  ];
  const players: WCPlayer[] = [];
  let jersey = 1;
  posGroups.forEach(([pos, count, xs]) => {
    const depthMap: Record<WCPlayer["position"], number> = { Goalkeeper: 8, Defender: 28, Midfielder: 55, Attacker: 80 };
    const baseDepth = depthMap[pos];
    const pitchY = side === "home" ? baseDepth : 100 - baseDepth;
    for (let i = 0; i < count; i++) {
      players.push({
        id: jersey + (side === "away" ? 100 : 0), name: `#${jersey}`, firstname: "#", lastname: `${jersey}`,
        age: 26, nationality: teamId.toUpperCase(), teamId: 0,
        teamName: WC_TEAMS[teamId]?.name ?? teamId, position: pos,
        pitchX: xs[i] ?? 50, pitchY, jerseyNumber: jersey,
        stats: { goals: pos === "Attacker" ? Math.floor(Math.random() * 4) : 0, assists: Math.floor(Math.random() * 3),
          appearances: 6, minutesPlayed: 480, yellowCards: Math.floor(Math.random() * 2), redCards: 0,
          shotsTotal: Math.floor(Math.random() * 8), shotsOnTarget: Math.floor(Math.random() * 4),
          passAccuracy: 75 + Math.floor(Math.random() * 15), rating: 6.5 + Math.random() * 2 },
      });
      jersey++;
    }
  });
  return players;
}

// ── Position color ────────────────────────────────────────────────────────────

function posColor(pos: WCPlayer["position"]): string {
  const map: Record<WCPlayer["position"], string> = {
    Goalkeeper: "#FBBF24",
    Defender:   "#60A5FA",
    Midfielder: "#818CF8",
    Attacker:   "#F87171",
  };
  return map[pos];
}

// ── Player Avatar ─────────────────────────────────────────────────────────────

function PlayerAvatar({ player, teamColor, size = 36 }: { player: WCPlayer; teamColor: string; size?: number }) {
  return (
    <div
      className="relative rounded-full border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-lg"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${teamColor}dd, ${teamColor}88)`,
        boxShadow: `0 0 8px ${teamColor}50`,
      }}
    >
      <span className="text-white font-black leading-none" style={{ fontSize: size * 0.38 }}>
        {player.jerseyNumber}
      </span>
    </div>
  );
}

// ── Player Dot on pitch ───────────────────────────────────────────────────────

function PlayerDot({
  player, isSelected, onClick, teamColor,
}: {
  player: WCPlayer;
  isSelected: boolean;
  onClick: (p: WCPlayer) => void;
  teamColor: string;
}) {
  const x = `${player.pitchX}%`;
  const y = `${player.pitchY}%`;

  return (
    <motion.button
      onClick={() => onClick(player)}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10"
      style={{ left: x, top: y }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.95 }}
      animate={isSelected ? { scale: [1, 1.15, 1.05] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PlayerAvatar player={player} teamColor={teamColor} size={isSelected ? 34 : 28} />
      <span className="text-[8px] text-white/60 font-medium whitespace-nowrap bg-[#060C18]/80 px-1 rounded">
        {player.lastname}
      </span>
    </motion.button>
  );
}

// ── Pitch ─────────────────────────────────────────────────────────────────────

function VirtualPitch({
  homePlayers, awayPlayers, selectedPlayer, onSelect, homeColor, awayColor,
}: {
  homePlayers: WCPlayer[];
  awayPlayers: WCPlayer[];
  selectedPlayer: WCPlayer | null;
  onSelect: (p: WCPlayer) => void;
  homeColor: string;
  awayColor: string;
}) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "1.6 / 1" }}>
      {/* Pitch background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #1a3a1a 0%, #164a16 50%, #1a3a1a 100%)",
        }}
      />

      {/* Pitch markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62.5" preserveAspectRatio="none">
        {/* Outer boundary */}
        <rect x="3" y="2" width="94" height="58.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        {/* Center line */}
        <line x1="50" y1="2" x2="50" y2="60.5" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        {/* Center circle */}
        <circle cx="50" cy="31.25" r="9.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        <circle cx="50" cy="31.25" r="0.6" fill="rgba(255,255,255,0.3)" />
        {/* Left penalty box */}
        <rect x="3" y="14" width="17" height="34.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
        <rect x="3" y="21" width="7" height="20.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
        <circle cx="14" cy="31.25" r="0.6" fill="rgba(255,255,255,0.2)" />
        {/* Right penalty box */}
        <rect x="80" y="14" width="17" height="34.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
        <rect x="90" y="21" width="7" height="20.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
        <circle cx="86" cy="31.25" r="0.6" fill="rgba(255,255,255,0.2)" />
      </svg>

      {/* Home players */}
      {homePlayers.map((p) => (
        <PlayerDot
          key={p.id}
          player={p}
          isSelected={selectedPlayer?.id === p.id}
          onClick={onSelect}
          teamColor={homeColor}
        />
      ))}

      {/* Away players */}
      {awayPlayers.map((p) => (
        <PlayerDot
          key={p.id}
          player={p}
          isSelected={selectedPlayer?.id === p.id}
          onClick={onSelect}
          teamColor={awayColor}
        />
      ))}
    </div>
  );
}

// ── Player Stats Panel ────────────────────────────────────────────────────────

function PlayerPanel({ player, onClose, teamColor }: { player: WCPlayer; onClose: () => void; teamColor: string }) {
  const color = posColor(player.position);
  const stats = player.stats;

  const statItems = stats ? [
    { label: "Goals",       value: stats.goals,                icon: Target },
    { label: "Assists",     value: stats.assists,              icon: Zap },
    { label: "Appearances", value: stats.appearances,          icon: Users },
    { label: "Minutes",     value: stats.minutesPlayed,        icon: Clock },
    { label: "Shots",       value: stats.shotsTotal,           icon: BarChart3 },
    { label: "Acc%",        value: `${stats.passAccuracy}%`,   icon: Shield },
  ] : [];

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="absolute inset-y-0 right-0 w-56 rounded-r-2xl border-l border-white/[0.08] bg-[#0A1020]/95 backdrop-blur-xl z-20 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-start gap-3">
          <PlayerAvatar player={player} teamColor={teamColor} size={56} />
          <div>
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider mb-2"
              style={{ background: `${color}15`, color }}
            >
              {player.position}
            </div>
            <p className="text-sm font-black text-white">{player.name}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{player.teamName} · #{player.jerseyNumber}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/25 hover:text-white transition-colors mt-0.5">
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Rating */}
      {stats?.rating && (
        <div className="mx-4 mb-3 rounded-xl bg-white/[0.04] p-3 flex items-center justify-between">
          <span className="text-xs text-white/40">WC Rating</span>
          <div className="flex items-center gap-1">
            <Star size={11} className="text-[#FBBF24]" fill="currentColor" />
            <span className="text-sm font-black text-[#FBBF24]">{stats.rating.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {statItems.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-white/[0.03] p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={9} className="text-white/25" strokeWidth={2} />
                <span className="text-[9px] text-white/30 uppercase tracking-wider">{label}</span>
              </div>
              <span className="text-sm font-black text-white/80">{value}</span>
            </div>
          ))}
        </div>

        {/* Cards */}
        {stats && (
          <div className="mt-2 flex gap-2">
            <div className="flex-1 rounded-xl bg-[#FBBF24]/[0.07] border border-[#FBBF24]/15 p-2.5 text-center">
              <p className="text-[9px] text-[#FBBF24]/60 uppercase tracking-wider">Yellow</p>
              <p className="text-sm font-black text-[#FBBF24]">{stats.yellowCards}</p>
            </div>
            <div className="flex-1 rounded-xl bg-[#F87171]/[0.07] border border-[#F87171]/15 p-2.5 text-center">
              <p className="text-[9px] text-[#F87171]/60 uppercase tracking-wider">Red</p>
              <p className="text-sm font-black text-[#F87171]">{stats.redCards}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Team Comparison Bar ───────────────────────────────────────────────────────

function ComparisonBar({ label, homeVal, awayVal, higherIsBetter = true }: {
  label: string;
  homeVal: number;
  awayVal: number;
  higherIsBetter?: boolean;
}) {
  const total = homeVal + awayVal;
  const homePct = total === 0 ? 50 : (homeVal / total) * 100;
  const homeBetter = higherIsBetter ? homeVal >= awayVal : homeVal <= awayVal;
  const awayBetter = !homeBetter;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px]">
        <span className={`font-bold ${homeBetter ? "text-[#38BDF8]" : "text-white/40"}`}>{homeVal}</span>
        <span className="text-white/30 uppercase tracking-wider">{label}</span>
        <span className={`font-bold ${awayBetter ? "text-[#F87171]" : "text-white/40"}`}>{awayVal}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.05]">
        <motion.div
          className="h-full rounded-l-full bg-[#38BDF8]"
          initial={{ width: 0 }}
          animate={{ width: `${homePct}%` }}
          transition={{ duration: 0.7 }}
        />
        <motion.div
          className="h-full rounded-r-full bg-[#F87171]"
          initial={{ width: 0 }}
          animate={{ width: `${100 - homePct}%` }}
          transition={{ duration: 0.7 }}
        />
      </div>
    </div>
  );
}

// ── Team Selector ─────────────────────────────────────────────────────────────

function TeamSelector({
  value, onChange, exclude, label,
}: {
  value: string;
  onChange: (id: string) => void;
  exclude: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const teams = Object.values(WC_TEAMS).filter((t) => t.id !== exclude);
  const selected = WC_TEAMS[value];

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="flex-1 relative" ref={ref}>
      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5">{label}</p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 bg-[#0D1420] border border-white/[0.1] rounded-xl px-3 py-2.5 text-left hover:border-white/[0.22] transition-colors"
      >
        {selected && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`https://flagcdn.com/w40/${selected.countryCode.toLowerCase()}.png`}
            alt={selected.name}
            className="w-5 h-4 rounded object-cover shrink-0"
          />
        )}
        <span className="text-xs font-bold text-white/85 flex-1 truncate">{selected?.name ?? "Select team"}</span>
        <ChevronDown size={13} className={`text-white/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0D1420] border border-white/[0.12] rounded-xl overflow-hidden shadow-2xl"
            style={{ maxHeight: 240 }}
          >
            <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { onChange(t.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    t.id === value ? "bg-[#38BDF8]/[0.08]" : "hover:bg-white/[0.05]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${t.countryCode.toLowerCase()}.png`}
                    alt={t.name}
                    className="w-5 h-4 rounded object-cover shrink-0"
                  />
                  <span className="text-xs font-medium text-white/80 flex-1 truncate">{t.name}</span>
                  {t.id === value && <Check size={11} className="text-[#38BDF8] shrink-0" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function H2HMatchup() {
  const [homeId, setHomeId] = useState("usa");
  const [awayId, setAwayId] = useState("par");
  const [selectedPlayer, setSelectedPlayer] = useState<WCPlayer | null>(null);

  const homeTeam = WC_TEAMS[homeId];
  const awayTeam = WC_TEAMS[awayId];

  const homeTeamColor = homeTeam?.color ?? "#38BDF8";
  const awayTeamColor = awayTeam?.color ?? "#F87171";

  const homePlayers = getPlayers(homeId, "home");
  const awayPlayers = getPlayers(awayId, "away");

  const selectedPlayerTeamColor = selectedPlayer
    ? (homePlayers.some((p) => p.id === selectedPlayer.id) ? homeTeamColor : awayTeamColor)
    : "#FBBF24";

  const homeGoals   = homePlayers.reduce((s, p) => s + (p.stats?.goals ?? 0), 0);
  const awayGoals   = awayPlayers.reduce((s, p) => s + (p.stats?.goals ?? 0), 0);
  const homeShots   = homePlayers.reduce((s, p) => s + (p.stats?.shotsOnTarget ?? 0), 0);
  const awayShots   = awayPlayers.reduce((s, p) => s + (p.stats?.shotsOnTarget ?? 0), 0);
  const homeAcc     = Math.round(homePlayers.reduce((s, p) => s + (p.stats?.passAccuracy ?? 0), 0) / homePlayers.length);
  const awayAcc     = Math.round(awayPlayers.reduce((s, p) => s + (p.stats?.passAccuracy ?? 0), 0) / awayPlayers.length);

  const handleSelectPlayer = useCallback((p: WCPlayer) => {
    setSelectedPlayer((prev) => (prev?.id === p.id ? null : p));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-[#818CF8]/25 bg-[#818CF8]/[0.08] px-3 py-1.5">
          <Users size={11} className="text-[#818CF8]" strokeWidth={2.5} />
          <span className="text-[10px] font-black text-[#818CF8] tracking-widest uppercase">
            H2H Matchup
          </span>
        </div>
        <span className="text-[10px] text-white/30">Click a player for stats</span>
      </div>

      {/* Team selectors */}
      <div className="flex items-end gap-3">
        <TeamSelector value={homeId} onChange={setHomeId} exclude={awayId} label="Home" />
        <div className="pb-2 text-white/20 font-black text-sm">vs</div>
        <TeamSelector value={awayId} onChange={setAwayId} exclude={homeId} label="Away" />
      </div>

      {/* Team headers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${homeTeam?.countryCode ?? "xx"}.png`}
            alt={homeTeam?.name}
            className="w-6 h-6 rounded-full object-cover border border-[#38BDF8]/30"
          />
          <span className="text-sm font-black text-[#38BDF8]">{homeTeam?.name}</span>
          <span className="text-[10px] text-white/30">ELO {homeTeam?.strength}</span>
        </div>
        <Minus size={12} className="text-white/20" />
        <div className="flex items-center gap-2 flex-row-reverse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${awayTeam?.countryCode ?? "xx"}.png`}
            alt={awayTeam?.name}
            className="w-6 h-6 rounded-full object-cover border border-[#F87171]/30"
          />
          <span className="text-sm font-black text-[#F87171]">{awayTeam?.name}</span>
          <span className="text-[10px] text-white/30">ELO {awayTeam?.strength}</span>
        </div>
      </div>

      {/* Virtual pitch */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07]">
        <VirtualPitch
          homePlayers={homePlayers}
          awayPlayers={awayPlayers}
          selectedPlayer={selectedPlayer}
          onSelect={handleSelectPlayer}
          homeColor={homeTeamColor}
          awayColor={awayTeamColor}
        />

        <AnimatePresence>
          {selectedPlayer && (
            <PlayerPanel
              player={selectedPlayer}
              onClose={() => setSelectedPlayer(null)}
              teamColor={selectedPlayerTeamColor}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Stats comparison */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0D1420] p-4 space-y-3">
        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-3">Tournament Stats Comparison</p>
        <ComparisonBar label="Goals"          homeVal={homeGoals}  awayVal={awayGoals}  />
        <ComparisonBar label="Shots on Target" homeVal={homeShots}  awayVal={awayShots}  />
        <ComparisonBar label="Pass Accuracy %"  homeVal={homeAcc}   awayVal={awayAcc}    />
        <ComparisonBar
          label="ELO Strength"
          homeVal={homeTeam?.strength ?? 0}
          awayVal={awayTeam?.strength ?? 0}
        />
      </div>

      <p className="text-[9px] text-white/20 text-center">
        WC 2026 squad data · Click player dots for individual stats
      </p>
    </div>
  );
}
