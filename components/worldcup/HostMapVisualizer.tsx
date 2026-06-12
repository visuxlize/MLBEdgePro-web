"use client";

import { useState, useCallback } from "react";
import {
  ComposableMap, Geographies, Geography, Marker, ZoomableGroup,
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Thermometer, Wind, Droplets, Settings, X, ChevronRight, Trophy, Users, ZoomIn, ZoomOut } from "lucide-react";
import { HOST_CITIES } from "@/lib/worldcup/data";
import type { HostCity, HostCountry } from "@/lib/worldcup/types";

// Natural-Earth 110m world countries (react-simple-maps fetches & parses internally)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO numeric codes for the three host nations
const HOST_NATION_IDS = new Set(["840", "124", "484"]); // USA, Canada, Mexico

// ── Color tokens ──────────────────────────────────────────────────────────────

const COUNTRY_COLORS: Record<HostCountry, { fill: string; hover: string; border: string }> = {
  USA:    { fill: "#0E1E35", hover: "#142541", border: "#1C3557" },
  Canada: { fill: "#130E1C", hover: "#1A1228", border: "#2E1A3A" },
  Mexico: { fill: "#0E1A12", hover: "#122217", border: "#1A3020" },
};

const MARKER_COLORS: Record<HostCountry, string> = {
  USA:    "#FBBF24", // amber-400
  Canada: "#F472B6", // pink-400
  Mexico: "#34D399", // emerald-400
};

// ── Settings panel ────────────────────────────────────────────────────────────

type MapLayer = "matches" | "capacity" | "weather" | "country";

const LAYER_LABELS: Record<MapLayer, string> = {
  matches:  "Match Count",
  capacity: "Stadium Capacity",
  weather:  "Climate",
  country:  "Country",
};

function SettingsPanel({ layer, onLayerChange, onClose }: {
  layer: MapLayer;
  onLayerChange: (l: MapLayer) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="absolute top-12 right-0 z-30 w-56 rounded-2xl border border-white/[0.1] bg-[#0D1420]/95 backdrop-blur-xl shadow-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Map Settings</p>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      <p className="text-[11px] text-white/40 mb-2">Marker Size By</p>
      <div className="space-y-1">
        {(Object.keys(LAYER_LABELS) as MapLayer[]).map((l) => (
          <button
            key={l}
            onClick={() => onLayerChange(l)}
            className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
              layer === l
                ? "bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/25"
                : "text-white/50 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            {LAYER_LABELS[l]}
            {layer === l && <ChevronRight size={12} />}
          </button>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        <p className="text-[11px] text-white/40 mb-2">Legend</p>
        <div className="space-y-1.5">
          {(Object.entries(MARKER_COLORS) as [HostCountry, string][]).map(([country, color]) => (
            <div key={country} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[11px] text-white/50">{country}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── City Tooltip ──────────────────────────────────────────────────────────────

function CityTooltip({ city, onClose }: { city: HostCity; onClose: () => void }) {
  const markerColor = MARKER_COLORS[city.country];

  return (
    <motion.div
      key={city.id}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-80 rounded-2xl border shadow-2xl overflow-hidden"
      style={{ borderColor: `${markerColor}30`, backgroundColor: "#0A0E18" }}
    >
      {/* Header glow */}
      <div
        className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 100% at 50% 0%, ${markerColor}18, transparent)` }}
      />

      <div className="relative p-4">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/30 hover:text-white/70 transition-colors"
        >
          <X size={14} />
        </button>

        {/* City header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${markerColor}18`, border: `1px solid ${markerColor}30` }}
          >
            <MapPin size={14} style={{ color: markerColor }} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">{city.displayName}</p>
              {city.isFinalVenue && (
                <span className="flex items-center gap-0.5 text-[9px] font-black text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/20 rounded-full px-2 py-0.5">
                  <Trophy size={8} strokeWidth={2.5} /> FINAL
                </span>
              )}
            </div>
            <p className="text-xs text-white/45">{city.stadium}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 py-2 text-center">
            <p className="text-[9px] text-white/35 uppercase tracking-wider">Capacity</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {city.capacity >= 1000 ? `${(city.capacity / 1000).toFixed(0)}K` : city.capacity}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 py-2 text-center">
            <p className="text-[9px] text-white/35 uppercase tracking-wider">Matches</p>
            <p className="text-sm font-bold text-white mt-0.5">{city.matchCount}</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 py-2 text-center">
            <p className="text-[9px] text-white/35 uppercase tracking-wider">TZ</p>
            <p className="text-sm font-bold text-white mt-0.5">{city.timezone}</p>
          </div>
        </div>

        {/* Weather */}
        <div
          className="rounded-xl border px-3 py-2 mb-3 flex items-center gap-3"
          style={{ borderColor: `${markerColor}20`, backgroundColor: `${markerColor}08` }}
        >
          <span className="text-xl">{city.weather.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80">{city.weather.condition}</p>
            <p className="text-[11px] text-white/40">{city.weather.tempF}°F Jun–Jul avg</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/35">
            <span className="flex items-center gap-0.5"><Droplets size={9} />{city.weather.humidity}%</span>
            <span className="flex items-center gap-0.5"><Wind size={9} />{city.weather.windMph}mph</span>
          </div>
        </div>

        {/* Upcoming matches */}
        <div>
          <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5">Scheduled Matches</p>
          <div className="space-y-1">
            {city.upcomingMatches.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-white/50">{m.matchLabel}</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: markerColor, background: `${markerColor}12` }}
                >
                  {m.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Pulsing marker ────────────────────────────────────────────────────────────

function CityMarker({
  city, layer, isSelected, isHovered, onSelect, onHover, onHoverEnd, index,
}: {
  city: HostCity;
  layer: MapLayer;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
  index: number;
}) {
  const markerColor = MARKER_COLORS[city.country];
  const isActive = isSelected || isHovered;

  // Marker size based on layer
  const baseRadius = (() => {
    switch (layer) {
      case "capacity": return 4 + (city.capacity / 90_000) * 8;
      case "matches":  return 4 + (city.matchCount / 8) * 6;
      default:         return city.isFinalVenue ? 9 : 6;
    }
  })();

  return (
    <Marker coordinates={city.coordinates}>
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.05, type: "spring", stiffness: 500, damping: 25 }}
        style={{ cursor: "pointer" }}
        onClick={onSelect}
        onMouseEnter={onHover}
        onMouseLeave={onHoverEnd}
      >
        {/* Outer pulse ring — only when active */}
        <AnimatePresence>
          {isActive && (
            <motion.circle
              r={baseRadius + 8}
              fill="none"
              stroke={markerColor}
              strokeWidth={1}
              initial={{ opacity: 0.8, r: baseRadius }}
              animate={{ opacity: 0, r: baseRadius + 14 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* Static glow */}
        <motion.circle
          r={baseRadius + 4}
          fill={markerColor}
          fillOpacity={isActive ? 0.2 : 0.08}
          animate={{ fillOpacity: isActive ? 0.2 : 0.08 }}
          transition={{ duration: 0.25 }}
        />

        {/* Main dot */}
        <motion.circle
          r={baseRadius}
          fill={markerColor}
          animate={{
            r: isActive ? baseRadius + 2 : baseRadius,
            filter: isActive ? `drop-shadow(0 0 6px ${markerColor})` : "none",
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Trophy star for Final venue */}
        {city.isFinalVenue && (
          <text x={0} y={-baseRadius - 4} textAnchor="middle" fontSize="10" fill="#FBBF24">⭐</text>
        )}

        {/* City name label */}
        <motion.text
          x={0}
          y={baseRadius + 11}
          textAnchor="middle"
          fontSize={isActive ? 8.5 : 7}
          fontWeight={isActive ? "700" : "500"}
          fill={isActive ? markerColor : "rgba(255,255,255,0.55)"}
          style={{ pointerEvents: "none", transition: "all 0.2s" }}
        >
          {city.displayName}
        </motion.text>
      </motion.g>
    </Marker>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function HostMapVisualizer() {
  const [selectedCity, setSelectedCity] = useState<HostCity | null>(null);
  const [hoveredCity, setHoveredCity]   = useState<HostCity | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layer, setLayer] = useState<MapLayer>("matches");
  const [zoom, setZoom]   = useState(1);

  const activeCity = selectedCity ?? hoveredCity;

  const handleSelectCity = useCallback((city: HostCity) => {
    setSelectedCity(prev => prev?.id === city.id ? null : city);
  }, []);

  const handleHoverCity  = useCallback((city: HostCity) => setHoveredCity(city), []);
  const handleHoverEnd   = useCallback(() => setHoveredCity(null), []);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.08] bg-[#060C18]"
      style={{ minHeight: 480 }}
    >
      {/* ── Top controls ──────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-[#FBBF24]/25 bg-[#FBBF24]/[0.08] px-3 py-1.5">
          <Trophy size={11} className="text-[#FBBF24]" strokeWidth={2.5} />
          <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase">
            WC 2026 Host Map
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/[0.07] px-2 py-1">
          <Users size={10} className="text-white/40" />
          <span className="text-[10px] text-white/40">{HOST_CITIES.length} venues</span>
        </div>
      </div>

      {/* ── Settings gear ──────────────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
            settingsOpen
              ? "bg-[#FBBF24]/15 border-[#FBBF24]/40 text-[#FBBF24]"
              : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white hover:border-white/20"
          }`}
        >
          <Settings size={13} strokeWidth={1.8} />
        </button>
        <AnimatePresence>
          {settingsOpen && (
            <SettingsPanel
              layer={layer}
              onLayerChange={setLayer}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Zoom controls ──────────────────────────────────────────────────── */}
      <div className="absolute right-4 bottom-16 z-20 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.min(z * 1.4, 8))}
          className="w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white flex items-center justify-center transition-colors"
        >
          <ZoomIn size={12} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z / 1.4, 1))}
          className="w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white flex items-center justify-center transition-colors"
        >
          <ZoomOut size={12} />
        </button>
      </div>

      {/* ── Map ──────────────────────────────────────────────────────────────── */}
      <ComposableMap
        width={900}
        height={520}
        projection="geoMercator"
        projectionConfig={{ center: [-97, 40], scale: 620 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={zoom} center={[-97, 40]}>
          {/* Ocean background */}
          <rect x={-9000} y={-9000} width={18000} height={18000} fill="#060C18" />

          {/* Country geographies */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isHost = HOST_NATION_IDS.has(String(geo.id));
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHost ? "#0C1929" : "#080E18"}
                    stroke={isHost ? "#1A3050" : "#0D1520"}
                    strokeWidth={isHost ? 0.8 : 0.4}
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none", fill: isHost ? "#0F2034" : "#080E18" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Host city markers */}
          {HOST_CITIES.map((city, i) => (
            <CityMarker
              key={city.id}
              city={city}
              layer={layer}
              isSelected={selectedCity?.id === city.id}
              isHovered={hoveredCity?.id === city.id}
              onSelect={() => handleSelectCity(city)}
              onHover={() => handleHoverCity(city)}
              onHoverEnd={handleHoverEnd}
              index={i}
            />
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* ── City tooltip ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeCity && (
          <CityTooltip
            city={activeCity}
            onClose={() => { setSelectedCity(null); setHoveredCity(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Bottom legend bar ─────────────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#060C18] to-transparent h-12 pointer-events-none" />
      <div className="absolute bottom-3 left-4 flex items-center gap-3">
        {(Object.entries(MARKER_COLORS) as [HostCountry, string][]).map(([country, color]) => (
          <div key={country} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="text-[10px] text-white/35">{country}</span>
          </div>
        ))}
        <span className="text-[10px] text-white/20">⭐ Final venue</span>
      </div>
    </div>
  );
}
