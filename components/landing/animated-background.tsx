"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

// ── Floating gradient orbs ─────────────────────────────────────────────────────
const ORBS = [
  { color: "rgba(255,120,40,0.18)",  size: 600, x: "15%",  y: "10%",  duration: 18, delay: 0    },
  { color: "rgba(129,140,248,0.12)", size: 500, x: "70%",  y: "5%",   duration: 22, delay: 3    },
  { color: "rgba(45,212,191,0.08)",  size: 400, x: "80%",  y: "60%",  duration: 25, delay: 6    },
  { color: "rgba(255,120,40,0.10)",  size: 350, x: "5%",   y: "70%",  duration: 20, delay: 9    },
  { color: "rgba(129,140,248,0.08)", size: 450, x: "45%",  y: "80%",  duration: 28, delay: 2    },
];

function GradientOrb({ orb }: { orb: typeof ORBS[0] }) {
  return (
    <motion.div
      style={{
        position: "absolute",
        left: orb.x,
        top: orb.y,
        width: orb.size,
        height: orb.size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
        filter: "blur(40px)",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
      animate={{
        x: [0, 60, -40, 20, 0],
        y: [0, -50, 30, -20, 0],
        scale: [1, 1.15, 0.92, 1.08, 1],
      }}
      transition={{
        duration: orb.duration,
        delay: orb.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ── Data stream lines (thin animated lines like stats flowing) ─────────────────
function DataLines() {
  const lines = [
    { x1: "0%",   y1: "30%",  x2: "100%", y2: "28%",  delay: 0,   dur: 8  },
    { x1: "0%",   y1: "55%",  x2: "100%", y2: "60%",  delay: 1.5, dur: 11 },
    { x1: "0%",   y1: "75%",  x2: "100%", y2: "72%",  delay: 3,   dur: 9  },
    { x1: "20%",  y1: "0%",   x2: "25%",  y2: "100%", delay: 0.8, dur: 14 },
    { x1: "65%",  y1: "0%",   x2: "60%",  y2: "100%", delay: 2.2, dur: 12 },
  ];

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.06 }}
    >
      {lines.map((l, i) => (
        <motion.line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#FF7828"
          strokeWidth="0.5"
          strokeDasharray="4 12"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
          transition={{
            duration: l.dur,
            delay: l.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </svg>
  );
}

// ── Floating stat chips (subtle data points that drift up) ────────────────────
const CHIPS = [
  { text: "67.3% win rate",   left: "8%",  startY: 75, color: "#FF7828",  delay: 0   },
  { text: "ERA 2.40",         left: "25%", startY: 80, color: "#818cf8",  delay: 2.5 },
  { text: "HR +14%",          left: "60%", startY: 70, color: "#50C882",  delay: 5   },
  { text: "Edge score 91",    left: "78%", startY: 78, color: "#FF7828",  delay: 7.5 },
  { text: "K/9 11.2",         left: "44%", startY: 85, color: "#2dd4bf",  delay: 10  },
];

function FloatingChips() {
  return (
    <>
      {CHIPS.map((chip, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            left: chip.left,
            top: `${chip.startY}%`,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 0,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 0.35, 0.35, 0],
            y: [0, -120, -180, -220],
          }}
          transition={{
            duration: 12,
            delay: chip.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide backdrop-blur-sm"
            style={{
              borderColor: `${chip.color}30`,
              backgroundColor: `${chip.color}10`,
              color: `${chip.color}`,
            }}
          >
            {chip.text}
          </span>
        </motion.div>
      ))}
    </>
  );
}

// ── Subtle dot grid ────────────────────────────────────────────────────────────
function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }}
    />
  );
}

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <DotGrid />
      <DataLines />
      {ORBS.map((orb, i) => <GradientOrb key={i} orb={orb} />)}
      <FloatingChips />
      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(10,14,20,0.7) 100%)",
        }}
      />
    </div>
  );
}
