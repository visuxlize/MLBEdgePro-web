"use client";

import { useState, useCallback } from "react";
import {
  ComposableMap, Geographies, Geography, Marker, ZoomableGroup,
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Thermometer, Wind, Droplets, Settings, X, ChevronRight, Trophy, Users, ZoomIn, ZoomOut, Flame } from "lucide-react";
import { HOST_CITIES } from "@/lib/worldcup/data";
import type { HostCity, HostCountry } from "@/lib/worldcup/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const HOST_NATION_IDS = new Set(["840", "124", "484"]);

const COUNTRY_COLORS: Record<HostCountry, { fill: string; stroke: string; glow: string }> = {
  USA:    { fill: "#0E2040", stroke: "#1E4A80", glow: "#1E6FFF" },
  Canada: { fill: "#1A0E25", stroke: "#3D1860", glow: "#9B30FF" },
  Mexico: { fill: "#0A1E10", stroke: "#1A4425", glow: "#22C55E" },
};

const MARKER_COLORS: Record<HostCountry, string> = {
  USA:    "#FBBF24",
  Canada: "#F472B6",
  Mexico: "#34D399",
};

type MapLayer = "matches" | "capacity" | "weather" | "country";
const LAYER_LABELS: Record<MapLayer, string> = {
  matches:  "Match Count",
  capacity: "Stadium Capacity",
  weather:  "Climate",
  country:  "Country",
};

// ── Settings Panel ────────────────────────────────────────────────────────────

function SettingsPanel({ layer, onLayerChange, onClose }: {
  layer: MapLayer; onLayerChange: (l: MapLayer) => void; onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="absolute top-12 right-0 z-30 w-52 rounded-2xl border border-white/[0.12] bg-[#060C18]/98 backdrop-blur-xl shadow-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Map View</p>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X size={14} /></button>
      </div>
      <div className="space-y-1">
        {(Object.keys(LAYER_LABELS) as MapLayer[]).map((l) => (
          <button key={l} onClick={() => onLayerChange(l)}
            className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
              layer === l ? "bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/25" : "text-white/50 hover:text-white hover:bg-white/[0.05]"
            }`}>
            {LAYER_LABELS[l]}
            {layer === l && <ChevronRight size={12} />}
          </button>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        <p className="text-[11px] text-white/40 mb-2">Legend</p>
        {(Object.entries(MARKER_COLORS) as [HostCountry, string][]).map(([country, color]) => (
          <div key={country} className="flex items-center gap-2 mb-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="text-[11px] text-white/50">{country}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── City Info Card ────────────────────────────────────────────────────────────

function CityCard({ city, onClose }: { city: HostCity; onClose: () => void }) {
  const color = MARKER_COLORS[city.country];

  return (
    <motion.div
      key={city.id}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-80 rounded-2xl border shadow-2xl overflow-hidden"
      style={{ borderColor: `${color}30`, backgroundColor: "#080E1A" }}
    >
      {/* Header glow */}
      <div className="absolute inset-x-0 top-0 h-20 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${color}20, transparent)` }} />

      <div className="relative p-4">
        <button onClick={onClose} className="absolute top-3 right-3 text-white/25 hover:text-white/70 transition-colors">
          <X size={14} />
        </button>

        {/* City + venue */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
            <MapPin size={15} style={{ color }} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-white">{city.displayName}</p>
              {city.isFinalVenue && (
                <span className="flex items-center gap-0.5 text-[9px] font-black text-[#FBBF24] bg-[#FBBF24]/12 border border-[#FBBF24]/25 rounded-full px-2 py-0.5">
                  <Trophy size={8} strokeWidth={2.5} /> FINAL
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/40">{city.stadium}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Capacity", value: city.capacity >= 1000 ? `${(city.capacity / 1000).toFixed(0)}K` : city.capacity },
            { label: "Matches",  value: city.matchCount },
            { label: "Zone",     value: city.timezone },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2 py-2 text-center">
              <p className="text-[9px] text-white/30 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-bold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Weather */}
        <div className="rounded-xl border px-3 py-2.5 mb-3 flex items-center gap-3"
          style={{ borderColor: `${color}18`, background: `${color}06` }}>
          <span className="text-xl shrink-0">{city.weather.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80">{city.weather.condition}</p>
            <p className="text-[10px] text-white/35">{city.weather.tempF}°F Jun–Jul avg</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/30 shrink-0">
            <span className="flex items-center gap-0.5"><Droplets size={9} />{city.weather.humidity}%</span>
            <span className="flex items-center gap-0.5"><Wind size={9} />{city.weather.windMph}mph</span>
          </div>
        </div>

        {/* Matches */}
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">Scheduled Matches</p>
          <div className="space-y-1">
            {city.upcomingMatches.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-white/45 truncate flex-1 mr-2">{m.matchLabel}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ color, background: `${color}12` }}>{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Animated City Marker ──────────────────────────────────────────────────────

function CityMarker({
  city, layer, isSelected, isHovered, onSelect, onHover, onHoverEnd, index,
}: {
  city: HostCity; layer: MapLayer;
  isSelected: boolean; isHovered: boolean;
  onSelect: () => void; onHover: () => void; onHoverEnd: () => void;
  index: number;
}) {
  const color = MARKER_COLORS[city.country];
  const isActive = isSelected || isHovered;

  const baseR = (() => {
    switch (layer) {
      case "capacity": return 3 + (city.capacity / 90_000) * 7;
      case "matches":  return 3 + (city.matchCount / 8) * 5;
      default:         return city.isFinalVenue ? 8 : 5;
    }
  })();

  const pulseDelay = (index * 0.4) % 3;

  return (
    <Marker coordinates={city.coordinates}>
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.06, type: "spring", stiffness: 400, damping: 22 }}
        style={{ cursor: "pointer" }}
        onClick={onSelect}
        onMouseEnter={onHover}
        onMouseLeave={onHoverEnd}
      >
        {/* Outermost slow pulse — always animated */}
        <motion.circle
          r={baseR + 12}
          fill="none"
          stroke={color}
          strokeWidth={0.8}
          animate={{ opacity: [0, 0.4, 0], r: [baseR + 4, baseR + 16, baseR + 4] }}
          transition={{ duration: 3, delay: pulseDelay, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Mid pulse ring */}
        <motion.circle
          r={baseR + 6}
          fill="none"
          stroke={color}
          strokeWidth={1}
          animate={{ opacity: [0.3, 0.7, 0.3], r: [baseR + 3, baseR + 8, baseR + 3] }}
          transition={{ duration: 2.2, delay: pulseDelay + 0.3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Glow halo */}
        <motion.circle
          r={baseR + 4}
          fill={color}
          animate={{ fillOpacity: isActive ? 0.25 : 0.07 }}
          transition={{ duration: 0.25 }}
        />

        {/* Main dot */}
        <motion.circle
          r={baseR}
          fill={color}
          animate={{
            r: isActive ? baseR + 2 : baseR,
            filter: isActive ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 3px ${color}80)`,
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Inner highlight */}
        <circle r={baseR * 0.35} fill="rgba(255,255,255,0.6)" />

        {/* Final venue star */}
        {city.isFinalVenue && (
          <motion.text
            x={0} y={-baseR - 5}
            textAnchor="middle" fontSize="12" fill="#FBBF24"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >⭐</motion.text>
        )}

        {/* City name */}
        <motion.text
          x={0} y={baseR + 12}
          textAnchor="middle"
          fontSize={isActive ? 9 : 7.5}
          fontWeight={isActive ? "800" : "600"}
          fill={isActive ? color : "rgba(255,255,255,0.65)"}
          style={{ pointerEvents: "none", transition: "all 0.2s" }}
          filter={isActive ? `drop-shadow(0 0 3px ${color}80)` : undefined}
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
  const handleHoverCity = useCallback((city: HostCity) => setHoveredCity(city), []);
  const handleHoverEnd  = useCallback(() => setHoveredCity(null), []);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.08]"
      style={{ minHeight: 500, background: "radial-gradient(ellipse 120% 60% at 50% 0%, #060F28, #040810)" }}
    >
      {/* Ambient glow overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 35% 60%, rgba(30,111,255,0.06), transparent), radial-gradient(ellipse 40% 30% at 65% 40%, rgba(155,48,255,0.05), transparent), radial-gradient(ellipse 30% 25% at 55% 75%, rgba(34,197,94,0.06), transparent)" }}
      />

      {/* Header controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-[#FBBF24]/30 bg-[#FBBF24]/[0.1] px-3 py-1.5 shadow-lg" style={{ boxShadow: "0 0 20px rgba(251,191,36,0.15)" }}>
          <Trophy size={11} className="text-[#FBBF24]" strokeWidth={2.5} />
          <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase">WC 2026 Host Map</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/[0.05] border border-white/[0.08] px-2.5 py-1">
          <Users size={10} className="text-white/40" />
          <span className="text-[10px] text-white/40">{HOST_CITIES.length} venues</span>
        </div>
      </div>

      {/* Settings */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
            settingsOpen ? "bg-[#FBBF24]/15 border-[#FBBF24]/40 text-[#FBBF24]" : "bg-white/[0.05] border-white/[0.1] text-white/40 hover:text-white hover:border-white/25"
          }`}
        >
          <Settings size={13} strokeWidth={1.8} />
        </button>
        <AnimatePresence>
          {settingsOpen && <SettingsPanel layer={layer} onLayerChange={setLayer} onClose={() => setSettingsOpen(false)} />}
        </AnimatePresence>
      </div>

      {/* Zoom controls */}
      <div className="absolute right-4 bottom-20 z-20 flex flex-col gap-1">
        {[{ label: "+", action: () => setZoom(z => Math.min(z * 1.4, 8)), icon: ZoomIn },
          { label: "–", action: () => setZoom(z => Math.max(z / 1.4, 1)), icon: ZoomOut }].map(({ action, icon: Icon }) => (
          <button key={Icon.displayName} onClick={action}
            className="w-7 h-7 rounded-lg border border-white/[0.1] bg-white/[0.05] text-white/50 hover:text-white flex items-center justify-center transition-all hover:bg-white/[0.08] backdrop-blur-sm">
            <Icon size={13} />
          </button>
        ))}
      </div>

      {/* Map */}
      <ComposableMap
        width={900} height={560}
        projection="geoMercator"
        projectionConfig={{ center: [-97, 40], scale: 630 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={zoom} center={[-97, 40]}>
          {/* Deep ocean */}
          <rect x={-9000} y={-9000} width={18000} height={18000} fill="#030810" />

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numId  = String(geo.id);
                const isUSA  = numId === "840";
                const isCAN  = numId === "124";
                const isMEX  = numId === "484";
                const isHost = isUSA || isCAN || isMEX;
                const country: HostCountry | null = isUSA ? "USA" : isCAN ? "Canada" : isMEX ? "Mexico" : null;
                const colors = country ? COUNTRY_COLORS[country] : null;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHost && colors ? colors.fill : "#04080F"}
                    stroke={isHost && colors ? colors.stroke : "#08101A"}
                    strokeWidth={isHost ? 0.7 : 0.3}
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none", fill: isHost && colors ? colors.glow + "20" : "#04080F" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {HOST_CITIES.map((city, i) => (
            <CityMarker
              key={city.id} city={city} layer={layer} index={i}
              isSelected={selectedCity?.id === city.id}
              isHovered={hoveredCity?.id === city.id}
              onSelect={() => handleSelectCity(city)}
              onHover={() => handleHoverCity(city)}
              onHoverEnd={handleHoverEnd}
            />
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* City detail card */}
      <AnimatePresence>
        {activeCity && <CityCard city={activeCity} onClose={() => { setSelectedCity(null); setHoveredCity(null); }} />}
      </AnimatePresence>

      {/* Bottom gradient + legend */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#030810] to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-4 flex items-center gap-4">
        {(Object.entries(MARKER_COLORS) as [HostCountry, string][]).map(([country, color]) => (
          <div key={country} className="flex items-center gap-1.5">
            <motion.div className="w-2.5 h-2.5 rounded-full"
              style={{ background: color }}
              animate={{ boxShadow: [`0 0 4px ${color}80`, `0 0 10px ${color}`, `0 0 4px ${color}80`] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[10px] text-white/40">{country}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="text-sm">⭐</span>
          <span className="text-[10px] text-white/30">Final venue</span>
        </div>
      </div>
    </div>
  );
}
