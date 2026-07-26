import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Search, X, MapPin as MapPinIcon,
  Bell, LayoutDashboard, Map as MapIcon, Settings, Users, Heart, TrendingUp,
  ChevronRight, CheckCircle2, CornerDownLeft,
} from "lucide-react";

// Palette: #009af2 · #a6e1fa · #e85d75 · #629677 · #b1c6c9 · #fffefd
const C = {
  blue:      "#009af2",
  lightBlue: "#a6e1fa",
  rose:      "#e85d75",
  green:     "#629677",
  grey:      "#b1c6c9",
  cream:     "#fffefd",
  navy:      "#1a1a2e",
};

type Screen = "loading" | "home" | "org-choice" | "org-signin" | "create-account" | "org-landing" | "donor-map";

// ── Seed data ─────────────────────────────────────────────────────────────────
type OrgItem = { category: string; items: string[] };
type NonprofitResult = {
  id: string; name: string; description: string;
  address: string; zip: string; location: { lat: number; lon: number };
  volunteersNeeded: boolean;
  mainContact: string; contactPhone: string; contactEmail: string; website: string;
  hours: string; category: string; organizationType: string;
  offers: OrgItem[]; needs: OrgItem[];
};

const SEED_NONPROFITS: NonprofitResult[] = [
  {
    id: "np-001", name: "Riverbend Community Pantry",
    description: "Serving Redlands families with emergency food assistance and wrap-around support since 2008. Walk-ins welcome.",
    address: "120 E State St, Redlands, CA 92373", zip: "92373",
    location: { lat: 34.0558, lon: -117.1825 }, volunteersNeeded: true,
    mainContact: "Maria Lopez", contactPhone: "(909) 555-0101",
    contactEmail: "hello@riverbendpantry.org", website: "riverbendpantry.org",
    hours: "Mon–Fri 9 AM–5 PM", category: "food", organizationType: "shelter",
    offers: [
      { category: "Food", items: ["Canned goods", "Fresh produce", "Baby formula", "Bread & grains"] },
      { category: "Household", items: ["Cleaning supplies", "Paper goods"] },
    ],
    needs: [
      { category: "Food", items: ["Cooking oil", "Pasta", "Cereal", "Protein items"] },
      { category: "Volunteer", items: ["Weekend shifts", "Delivery drivers"] },
    ],
  },
  {
    id: "np-002", name: "Horizon Youth Learning Hub",
    description: "Free tutoring, mentorship, and career readiness programs for youth ages 8–18 in the Fontana area.",
    address: "450 Citrus Ave, Fontana, CA 92335", zip: "92335",
    location: { lat: 34.0922, lon: -117.435 }, volunteersNeeded: true,
    mainContact: "James Patel", contactPhone: "(909) 555-0127",
    contactEmail: "contact@horizonyouth.org", website: "horizonyouth.org",
    hours: "Tue–Sat 10 AM–6 PM", category: "education", organizationType: "youth",
    offers: [
      { category: "Education", items: ["Math tutoring", "Science help", "SAT prep", "Career counseling"] },
      { category: "Clothing", items: ["School uniforms", "Backpacks & supplies"] },
    ],
    needs: [
      { category: "Education", items: ["STEM tutors", "Reading coaches"] },
      { category: "Clothing", items: ["Kids' shoes (sizes 4–10)", "Winter coats"] },
    ],
  },
  {
    id: "np-003", name: "Sunrise Family Shelter",
    description: "Emergency and transitional shelter for families experiencing homelessness. Open 24/7 with on-site case management.",
    address: "890 Valley Blvd, Colton, CA 92324", zip: "92324",
    location: { lat: 34.0673, lon: -117.3227 }, volunteersNeeded: false,
    mainContact: "Elena Kim", contactPhone: "(909) 555-0143",
    contactEmail: "support@sunriseshelter.org", website: "sunriseshelter.org",
    hours: "Daily 24/7", category: "housing", organizationType: "shelter",
    offers: [
      { category: "Housing", items: ["Emergency beds", "Transitional units", "Storage lockers"] },
      { category: "Food", items: ["Three meals daily", "Baby formula & diapers"] },
      { category: "Support", items: ["Case management", "Job placement", "Childcare"] },
    ],
    needs: [
      { category: "Food", items: ["Non-perishable items", "Snack bars", "Juice boxes"] },
      { category: "Household", items: ["Towels & bedding", "Hygiene kits", "Laundry detergent"] },
    ],
  },
  {
    id: "np-004", name: "Northside Health Access Network",
    description: "Mobile clinic and intake services connecting uninsured residents in San Bernardino to free healthcare and wellness resources.",
    address: "230 North D St, San Bernardino, CA 92401", zip: "92401",
    location: { lat: 34.1083, lon: -117.2898 }, volunteersNeeded: true,
    mainContact: "Rosa Martinez", contactPhone: "(909) 555-0164",
    contactEmail: "admin@northsidehealth.org", website: "northsidehealth.org",
    hours: "Mon–Sat 8 AM–7 PM", category: "health", organizationType: "health",
    offers: [
      { category: "Health", items: ["Free check-ups", "Dental screenings", "Mental health intake", "Prescriptions (select)"] },
      { category: "Support", items: ["Insurance enrollment help", "Translation services"] },
    ],
    needs: [
      { category: "Volunteer", items: ["Medical professionals", "Intake coordinators"] },
      { category: "Supplies", items: ["First aid kits", "Blood pressure cuffs", "Masks & gloves"] },
    ],
  },
  {
    id: "np-005", name: "Oak Glen Community Closet",
    description: "A free clothing boutique offering gently used apparel for adults and children in the greater Riverside area.",
    address: "411 Market St, Riverside, CA 92501", zip: "92501",
    location: { lat: 33.9816, lon: -117.3755 }, volunteersNeeded: false,
    mainContact: "Taylor Greene", contactPhone: "(951) 555-0185",
    contactEmail: "team@oakglencloset.org", website: "oakglencloset.org",
    hours: "Wed–Sun 10 AM–4 PM", category: "clothing", organizationType: "community",
    offers: [
      { category: "Clothing", items: ["Women's wear", "Men's wear", "Kids' clothes", "Shoes & boots", "Winter coats"] },
      { category: "Household", items: ["Linens", "Small appliances"] },
    ],
    needs: [
      { category: "Clothing", items: ["Plus-size women's", "Men's work clothes", "Teen clothing"] },
      { category: "Shoes", items: ["Men's size 10–14", "Kids' sneakers"] },
    ],
  },
];

// Map projection
const LON_MIN = -117.48, LON_RANGE = 0.35, LAT_MAX = 34.15, LAT_RANGE = 0.22;
const MAP_W = 800, MAP_H = 560, PAD_X = 60, PAD_Y = 50;
function lonToX(lon: number) { return PAD_X + ((lon - LON_MIN) / LON_RANGE) * (MAP_W - PAD_X * 2); }
function latToY(lat: number) { return PAD_Y + ((LAT_MAX - lat) / LAT_RANGE) * (MAP_H - PAD_Y * 2); }

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "food", label: "Food" },
  { value: "education", label: "Education" },
  { value: "housing", label: "Housing" },
  { value: "health", label: "Health" },
  { value: "clothing", label: "Clothing" },
];

// Heart path helper
function heartPath(cx: number, cy: number, r: number) {
  return [
    `M ${cx},${cy + 0.35 * r}`,
    `C ${cx - r},${cy + 0.05 * r} ${cx - 1.5 * r},${cy - 0.5 * r} ${cx - r},${cy - 0.9 * r}`,
    `C ${cx - 0.6 * r},${cy - 1.3 * r} ${cx},${cy - 0.9 * r} ${cx},${cy - 0.4 * r}`,
    `C ${cx},${cy - 0.9 * r} ${cx + 0.6 * r},${cy - 1.3 * r} ${cx + r},${cy - 0.9 * r}`,
    `C ${cx + 1.5 * r},${cy - 0.5 * r} ${cx + r},${cy + 0.05 * r} ${cx},${cy + 0.35 * r} Z`,
  ].join(" ");
}

// Logo geometry (shared between PinhelpLogo and LoadingRing)
function logoGeom(size: number) {
  const W       = size * 2.8;
  const globeR  = size * 0.42;
  const topPad  = size * 0.06;
  const globeCy = topPad + globeR;
  const globeCx = W / 2;
  const pinBodyH = size * 0.3;
  const pinW     = size * 0.22;
  const pinTipH  = size * 0.15;
  const textSize = size * 0.52;
  const textGap  = size * 0.12;
  const textY    = globeCy + globeR + pinBodyH + pinTipH + textGap + textSize * 0.75;
  const totalH   = textY + size * 0.14;
  return { W, globeR, globeCy, globeCx, pinBodyH, pinW, pinTipH, textSize, textY, totalH };
}

// ── PinhelpLogo ────────────────────────────────────────────────────────────────
function PinhelpLogo({ size = 80 }: { size?: number }) {
  const g = logoGeom(size);
  const { W, globeR, globeCy, globeCx, pinBodyH, pinW, pinTipH, textSize, textY, totalH } = g;

  return (
    <svg
      width={W}
      height={totalH}
      viewBox={`0 0 ${W} ${totalH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PinHelp logo"
      overflow="visible"
    >
      {/* Globe */}
      <circle cx={globeCx} cy={globeCy} r={globeR} fill={C.lightBlue} stroke={C.rose} strokeWidth="2" />

      {/* Land masses */}
      <ellipse cx={globeCx - globeR * 0.28} cy={globeCy - globeR * 0.2} rx={globeR * 0.28} ry={globeR * 0.22} fill={C.green} opacity="0.85" />
      <ellipse cx={globeCx + globeR * 0.22} cy={globeCy - globeR * 0.05} rx={globeR * 0.22} ry={globeR * 0.18} fill={C.green} opacity="0.8" />
      <ellipse cx={globeCx - globeR * 0.05} cy={globeCy + globeR * 0.32} rx={globeR * 0.3} ry={globeR * 0.16} fill={C.green} opacity="0.75" />

      {/* Globe grid lines */}
      <ellipse cx={globeCx} cy={globeCy} rx={globeR * 0.5} ry={globeR} stroke={C.blue} strokeWidth="0.7" fill="none" opacity="0.4" />
      <line x1={globeCx} y1={globeCy - globeR} x2={globeCx} y2={globeCy + globeR} stroke={C.blue} strokeWidth="0.7" opacity="0.3" />
      <ellipse cx={globeCx} cy={globeCy} rx={globeR} ry={globeR * 0.3} stroke={C.blue} strokeWidth="0.7" fill="none" opacity="0.35" />
      <ellipse cx={globeCx} cy={globeCy} rx={globeR} ry={globeR * 0.65} stroke={C.blue} strokeWidth="0.7" fill="none" opacity="0.3" />

      {/* Pin body */}
      <rect
        x={globeCx - pinW / 2}
        y={globeCy + globeR - 2}
        width={pinW}
        height={pinBodyH}
        rx={pinW * 0.35}
        fill={C.rose}
      />
      {/* Pin tip */}
      <polygon
        points={`${globeCx - pinW / 2},${globeCy + globeR + pinBodyH - 2} ${globeCx + pinW / 2},${globeCy + globeR + pinBodyH - 2} ${globeCx},${globeCy + globeR + pinBodyH + pinTipH - 2}`}
        fill="#c0334e"
      />
      {/* Pin cap dot */}
      <circle cx={globeCx} cy={globeCy} r={globeR * 0.18} fill={C.rose} opacity="0.9" />

      {/* PINHELP text */}
      <text
        x={globeCx}
        y={textY}
        textAnchor="middle"
        fontSize={textSize}
        fontWeight="900"
        fontFamily="'Nunito', sans-serif"
        fill={C.navy}
        letterSpacing={size * 0.04}
      >
        PINHELP
      </text>
    </svg>
  );
}

// ── MapBackground ─────────────────────────────────────────────────────────────
const BG_HEARTS = [
  [250, 200, 10], [700, 300, 13], [1150, 200, 9], [320, 520, 11],
  [1180, 540, 10], [500, 430, 8], [900, 150, 12], [80, 650, 9],
  [1350, 380, 11], [620, 750, 8], [1050, 620, 13], [180, 330, 10],
  [820, 470, 9], [1260, 120, 8], [440, 80, 12],
];

function MapBackground() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1440" height="900" fill={C.cream} />
      <rect width="1440" height="900" fill={C.lightBlue} opacity="0.25" />

      {/* Grid lines */}
      {[100, 200, 300, 400, 500, 600, 700, 800].map((y) => (
        <line key={`lat${y}`} x1="0" y1={y} x2="1440" y2={y} stroke={C.grey} strokeWidth="0.7" opacity="0.5" />
      ))}
      {[120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320].map((x) => (
        <line key={`lon${x}`} x1={x} y1="0" x2={x} y2="900" stroke={C.grey} strokeWidth="0.7" opacity="0.5" />
      ))}

      {/* Land masses */}
      <path d="M60 120 Q110 80 200 90 Q280 95 320 140 Q360 180 350 240 Q340 300 300 340 Q260 380 220 400 Q180 380 160 340 Q130 290 100 260 Q70 230 60 180 Z" fill={C.green} stroke={C.green} strokeWidth="1" opacity="0.4" />
      <path d="M200 440 Q260 420 300 460 Q340 500 330 580 Q320 660 280 700 Q240 730 210 700 Q175 660 170 580 Q165 510 185 470 Z" fill={C.green} stroke={C.green} strokeWidth="1" opacity="0.35" />
      <path d="M600 80 Q650 65 710 75 Q760 85 780 120 Q790 155 760 175 Q730 195 700 185 Q660 175 630 155 Q600 135 600 110 Z" fill={C.green} stroke={C.green} strokeWidth="1" opacity="0.38" />
      <path d="M620 220 Q680 200 730 215 Q780 230 800 290 Q820 360 810 440 Q800 510 770 550 Q740 580 700 575 Q660 570 640 535 Q610 490 600 420 Q585 340 590 270 Z" fill={C.green} stroke={C.green} strokeWidth="1" opacity="0.35" />
      <path d="M780 60 Q900 40 1040 55 Q1160 68 1220 110 Q1270 150 1260 210 Q1250 270 1200 300 Q1140 330 1060 320 Q980 310 920 280 Q860 250 820 210 Q780 170 770 120 Z" fill={C.green} stroke={C.green} strokeWidth="1" opacity="0.38" />
      <path d="M1080 480 Q1150 460 1210 490 Q1260 520 1250 590 Q1240 650 1190 670 Q1140 685 1100 655 Q1055 620 1055 560 Q1055 505 1080 480 Z" fill={C.green} stroke={C.green} strokeWidth="1" opacity="0.35" />

      {/* Heart pins */}
      {BG_HEARTS.map(([cx, cy, r], i) => (
        <path
          key={`heart${i}`}
          d={heartPath(cx, cy, r)}
          fill={C.rose}
          opacity={i % 3 === 0 ? 0.28 : i % 3 === 1 ? 0.2 : 0.24}
        />
      ))}

      {/* Compass */}
      <g transform="translate(1360, 820)" opacity="0.18">
        <circle cx="0" cy="0" r="28" fill="none" stroke={C.navy} strokeWidth="1" />
        <line x1="0" y1="-28" x2="0" y2="28" stroke={C.navy} strokeWidth="1" />
        <line x1="-28" y1="0" x2="28" y2="0" stroke={C.navy} strokeWidth="1" />
        <polygon points="0,-28 -5,-10 5,-10" fill={C.navy} />
        <text x="0" y="-32" textAnchor="middle" fontSize="10" fill={C.navy} fontFamily="serif">N</text>
      </g>

      {/* Vignette */}
      <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor={C.cream} stopOpacity="0" />
        <stop offset="100%" stopColor={C.cream} stopOpacity="0.5" />
      </radialGradient>
      <rect width="1440" height="900" fill="url(#vignette)" />
    </svg>
  );
}

// ── OrgIcon ───────────────────────────────────────────────────────────────────
function OrgIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 22L24 8L40 22V40H30V30H18V40H8V22Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
      <path d={heartPath(24, 28, 7)} fill={C.rose} />
    </svg>
  );
}

// ── DonorIcon ─────────────────────────────────────────────────────────────────
function DonorIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="14" r="7" stroke="currentColor" strokeWidth="2.2" fill="none" />
      <path d="M10 38C10 30.3 16.3 24 24 24C31.7 24 38 30.3 38 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Heart shifted down ~4 units vs org icon */}
      <path d={heartPath(24, 32, 7)} fill={C.rose} />
    </svg>
  );
}

// ── LoadingRing ───────────────────────────────────────────────────────────────
function LoadingRing({ size }: { size: number }) {
  const { W, globeCy, globeCx, globeR, totalH } = logoGeom(size);
  const ringR = globeR + size * 0.14;
  const pad = 28;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <svg
        width={W + pad * 2}
        height={totalH + pad * 2}
        viewBox={`${-pad} ${-pad} ${W + pad * 2} ${totalH + pad * 2}`}
        fill="none"
        aria-hidden="true"
      >
        <motion.circle
          cx={globeCx}
          cy={globeCy}
          r={ringR}
          stroke={C.rose}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="140 60"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${globeCx}px ${globeCy}px` }}
          opacity={0.85}
        />
      </svg>
    </motion.div>
  );
}

// ── SVG Interactive Map ────────────────────────────────────────────────────────
function InteractiveMap({ results, selectedOrgId, onPinClick }: { results: NonprofitResult[]; selectedOrgId: string | null; onPinClick: (org: NonprofitResult) => void }) {
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width={MAP_W} height={MAP_H} fill="#e8f4fb" />
      <rect x="480" y="60" width="180" height="140" rx="4" fill={C.green} opacity="0.3" />
      <rect x="80" y="380" width="120" height="90" rx="4" fill={C.green} opacity="0.28" />
      <rect x="580" y="380" width="160" height="100" rx="4" fill={C.green} opacity="0.28" />
      <path d={`M0 460 Q200 440 400 470 Q600 490 800 460 L800 560 L0 560 Z`} fill={C.lightBlue} opacity="0.5" />
      {[148, 278, 418].map((y, i) => <rect key={`mhr${i}`} x="0" y={y} width={MAP_W} height="12" fill="#fff" opacity="0.9" />)}
      {[148, 348, 548, 718].map((x, i) => <rect key={`mvr${i}`} x={x} y="0" width="12" height={MAP_H} fill="#fff" opacity="0.9" />)}
      {[80, 210, 345, 495].map((y, i) => <rect key={`mh${i}`} x="0" y={y} width={MAP_W} height="5" fill={C.grey} opacity="0.3" />)}
      {[70, 248, 448, 638].map((x, i) => <rect key={`mv${i}`} x={x} y="0" width="5" height={MAP_H} fill={C.grey} opacity="0.3" />)}
      <text x="660" y="95" textAnchor="middle" fontSize="11" fill={C.navy} fontFamily="sans-serif" opacity="0.5">Redlands</text>
      <text x="130" y="145" textAnchor="middle" fontSize="11" fill={C.navy} fontFamily="sans-serif" opacity="0.5">Fontana</text>
      <text x="370" y="215" textAnchor="middle" fontSize="11" fill={C.navy} fontFamily="sans-serif" opacity="0.5">Colton</text>
      <text x="445" y="135" textAnchor="middle" fontSize="11" fill={C.navy} fontFamily="sans-serif" opacity="0.5">San Bernardino</text>
      <text x="248" y="385" textAnchor="middle" fontSize="11" fill={C.navy} fontFamily="sans-serif" opacity="0.5">Riverside</text>
      <g transform={`translate(${MAP_W - 36}, ${MAP_H - 36})`} opacity="0.22">
        <circle cx="0" cy="0" r="22" fill="none" stroke={C.navy} strokeWidth="1" />
        <line x1="0" y1="-22" x2="0" y2="22" stroke={C.navy} strokeWidth="1" />
        <line x1="-22" y1="0" x2="22" y2="0" stroke={C.navy} strokeWidth="1" />
        <polygon points="0,-22 -4,-8 4,-8" fill={C.navy} />
        <text x="0" y="-25" textAnchor="middle" fontSize="8" fill={C.navy} fontFamily="serif">N</text>
      </g>
      {results.map((org) => {
        const cx = lonToX(org.location.lon);
        const cy = latToY(org.location.lat);
        const active = selectedOrgId === org.id;
        const fill = org.volunteersNeeded ? C.rose : C.green;
        const r = 10;
        return (
          <g key={org.id} onClick={() => onPinClick(org)} style={{ cursor: "pointer" }}>
            {active && <circle cx={cx} cy={cy} r={22} fill={fill} opacity="0.18" />}
            <path d={heartPath(cx, cy - 2, r)} fill={active ? fill : fill} stroke="#fff" strokeWidth="1.2" opacity={active ? 1 : 0.85} />
          </g>
        );
      })}
    </svg>
  );
}

// ── MapPopup ──────────────────────────────────────────────────────────────────
function MapPopup({ org, onClose }: { org: NonprofitResult; onClose: () => void }) {
  const cx = lonToX(org.location.lon);
  const cy = latToY(org.location.lat);
  const leftPct = (cx / MAP_W) * 100;
  const topPct = ((cy - 14) / MAP_H) * 100;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="absolute z-30 w-64 shadow-xl rounded-xl overflow-hidden pointer-events-auto"
      style={{ left: `${Math.min(Math.max(leftPct, 5), 68)}%`, top: `${Math.max(topPct - 40, 2)}%`, transform: "translateX(-50%)" }}
    >
      <div className="px-4 py-3 flex items-start justify-between" style={{ background: C.rose }}>
        <div>
          <p className="font-extrabold text-sm leading-tight text-white">{org.name}</p>
          <p className="text-xs text-white/80 mt-0.5">{org.address}</p>
        </div>
        <button onClick={onClose} className="ml-2 text-white/80 hover:text-white flex-shrink-0 mt-0.5" aria-label="Close"><X size={14} /></button>
      </div>
      <div className="bg-white px-4 py-3 text-xs space-y-2">
        <p><span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: C.rose }}>Contact </span>{org.mainContact} · {org.contactPhone}</p>
        <p><span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: C.rose }}>Hours </span>{org.hours}</p>
        <p><span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: C.rose }}>Needs </span>{org.needs.flatMap((g) => g.items).join(", ")}</p>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`} style={{ background: org.volunteersNeeded ? `${C.rose}20` : `${C.green}20`, color: org.volunteersNeeded ? C.rose : C.green }}>
          {org.volunteersNeeded ? "Volunteers Needed" : "Donations Accepted"}
        </span>
      </div>
    </motion.div>
  );
}

// ── ArcGIS donor integration ──────────────────────────────────────────────────
declare global {
  interface Window {
    __APP_CONFIG?: { arcgisApiKey?: string };
    require?: (
      modules: string[],
      onLoad: (...args: any[]) => void,
      onError?: (error: unknown) => void
    ) => void;
  }
}

type ArcgisOrgResult = {
  id: string;
  name: string;
  city: string;
  zip: string;
  missionArea: string;
  address: string;
  volunteersNeeded: boolean;
  categories: string[];
  feature: any;
};

type RegistrationMapRow = {
  id: string;
  organizationName: string;
  address: string;
  city: string;
  zip: string;
  missionArea: string;
  mainContact: string;
  contactEmail: string;
  websiteLink: string;
  workingHours: string;
  description: string;
  needVolunteers: boolean | string;
  latitude: number;
  longitude: number;
  foodYN: string;
  foodText: string;
  clothesYN: string;
  clothesText: string;
  shelterYN: string;
  shelterText: string;
  beddingYN: string;
  beddingText: string;
  toiletriesYN: string;
  toiletriesText: string;
  furnitureYN: string;
  furnitureText: string;
  medicalSuppliesYN: string;
  medicalSuppliesText: string;
  electronicsYN: string;
  electronicsText: string;
  educationMaterialsYN: string;
  educationMaterialsText: string;
  babyItemsYN: string;
  babyItemsText: string;
  cleaningItemsYN: string;
  cleaningItemsText: string;
};

const DONOR_FEATURE_LAYER_ITEM_ID = "f01aa3b7a3b74026b405a853dbb91c61";

const RESOURCE_FILTERS = [
  { key: "food", label: "Food", ynField: "Food_Y_N", textField: "Food_Text", legacyOfferField: "Offer_Food_Y_N", keywords: ["food", "pantry", "meal", "nutrition", "hunger"] },
  { key: "clothing", label: "Clothing", ynField: "Clothes_Y_N", textField: "Clothes_Text", legacyOfferField: "Offer_Clothes_Y_N", keywords: ["clothing", "clothes", "apparel", "closet"] },
  { key: "furniture", label: "Furniture", ynField: "Furniture_Y_N", textField: "Furniture_Text", legacyOfferField: "Offer_Furniture_Y_N", keywords: ["furniture", "bed", "table", "chair", "mattress"] },
  { key: "baby", label: "Baby Items", ynField: "Baby_Items_Y_N", textField: "Baby_Items_Text", legacyOfferField: "Offer_Baby_Items_Y_N", keywords: ["baby", "infant", "diaper", "formula"] },
  { key: "hygiene", label: "Cleaning Items", ynField: "Cleaning_Items_Y_N", textField: "Cleaning_Items_Text", legacyOfferField: "Offer_Cleaning_Items_Y_N", keywords: ["clean", "cleaning", "hygiene", "toiletries"] },
] as const;

const SECTOR_FILTERS = [
  { value: "food", label: "Food" },
  { value: "education", label: "Education" },
  { value: "housing", label: "Housing" },
  { value: "health", label: "Health" },
  { value: "clothing", label: "Clothing" },
];

const DONATION_NEED_SIGNALS = [
  { label: "Bedding", ynField: "Bedding_Y_N", textField: "Bedding_Text", legacyOfferField: "Offer_Bedding_Y_N", keywords: ["bedding", "bed", "blanket", "linens"] },
  { label: "Food", ynField: "Food_Y_N", textField: "Food_Text", legacyOfferField: "Offer_Food_Y_N", keywords: ["food", "meal", "pantry", "hunger", "nutrition"] },
  { label: "Clothes", ynField: "Clothes_Y_N", textField: "Clothes_Text", legacyOfferField: "Offer_Clothes_Y_N", keywords: ["clothing", "clothes", "apparel", "closet"] },
  { label: "Toiletries", ynField: "Toiletries_Y_N", textField: "Toiletries_Text", legacyOfferField: "Offer_Toiletries_Y_N", keywords: ["toiletries", "hygiene", "soap", "shampoo"] },
  { label: "Furniture", ynField: "Furniture_Y_N", textField: "Furniture_Text", legacyOfferField: "Offer_Furniture_Y_N", keywords: ["furniture", "table", "chair", "mattress"] },
  { label: "Medical Supplies", ynField: "Medical_Supplies_Y_N", textField: "Medical_Supplies_Text", legacyOfferField: "Offer_Medical_Supplies_Y_N", keywords: ["medical", "clinic", "health", "wellness"] },
  { label: "Shelter", ynField: "Shelter_Y_N", textField: "Shelter_Text", legacyOfferField: "Offer_Shelter_Y_N", keywords: ["shelter", "housing", "homeless", "transitional"] },
  { label: "Electronics", ynField: "Electronics_Y_N", textField: "Electronics_Text", legacyOfferField: "Offer_Electronics_Y_N", keywords: ["electronics", "computer", "device", "tech"] },
  { label: "Education Materials", ynField: "Education_Materials_Y_N", textField: "Education_Materials_Text", legacyOfferField: "Offer_Education_Materials_Y_N", keywords: ["education", "school", "tutoring", "learning", "youth"] },
  { label: "Baby Items", ynField: "Baby_Items_Y_N", textField: "Baby_Items_Text", legacyOfferField: "Offer_Baby_Items_Y_N", keywords: ["baby", "infant", "diaper", "formula"] },
  { label: "Cleaning Items", ynField: "Cleaning_Items_Y_N", textField: "Cleaning_Items_Text", legacyOfferField: "Offer_Cleaning_Items_Y_N", keywords: ["clean", "cleaning", "sanitation"] },
] as const;

const escapeSql = (value: string) => String(value || "").replace(/'/g, "''");

const isYes = (value: unknown) => String(value ?? "").trim().toLowerCase() === "yes";

const parseListText = (value: unknown): string[] =>
  String(value ?? "")
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);

const prettifyFieldName = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getDonationNeedDetails = (attrs: Record<string, unknown>) => {
  const details: Array<{ label: string; items: string[] }> = [];

  DONATION_NEED_SIGNALS.forEach((signal) => {
    const items = parseListText(attrs[signal.textField]);
    const hasYes = isYes(attrs[signal.ynField]) || isYes(attrs[signal.legacyOfferField]);
    if (hasYes || items.length > 0) {
      details.push({ label: signal.label, items });
    }
  });

  return details;
};

const ensureRuntimeConfig = async () => {
  if (window.__APP_CONFIG) return window.__APP_CONFIG;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-app-config="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Config failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/app-config.js";
    script.async = true;
    script.dataset.appConfig = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Config failed to load"));
    document.body.appendChild(script);
  });

  return window.__APP_CONFIG;
};

const loadArcgisModules = () =>
  new Promise<any[]>((resolve, reject) => {
    if (!window.require) {
      reject(new Error("ArcGIS SDK was not loaded"));
      return;
    }

    window.require(
      [
        "esri/config",
        "esri/Map",
        "esri/layers/FeatureLayer",
        "esri/views/MapView",
        "esri/widgets/LayerList",
        "esri/widgets/Search",
        "esri/rest/serviceArea",
        "esri/rest/support/ServiceAreaParameters",
        "esri/rest/support/FeatureSet",
        "esri/Graphic",
        "esri/layers/GraphicsLayer",
        "esri/rest/route",
        "esri/rest/support/RouteParameters",
        "esri/rest/networkService"
      ],
      (...modules) => resolve(modules),
      reject
    );
  });

// ── DonorMapScreen ─────────────────────────────────────────────────────────────
function DonorMapScreen({ onBack }: { onBack: () => void }) {
  const PIN_SELECTED_FIELD = "Pin_Selected";
  const PIN_CIRCLE_URL = "/pin-circle.svg";
  const PIN_HEART_URL = "/pin-heart.svg";

  const [queryText, setQueryText] = useState("");
  const [orgNameFilter, setOrgNameFilter] = useState("");
  const [zipFilter, setZipFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [results, setResults] = useState<ArcgisOrgResult[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [detailOrg, setDetailOrg] = useState<ArcgisOrgResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [staffingFilter, setStaffingFilter] = useState<"any" | "needed" | "not-needed">("any");
  const [selectedResourceFilters, setSelectedResourceFilters] = useState<Set<string>>(new Set());
  const [selectedSectorFilters, setSelectedSectorFilters] = useState<Set<string>>(new Set());

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapViewRef = useRef<any>(null);
  const sourceLayerRef = useRef<any>(null);
  const layerQueryUrlRef = useRef<string>("");
  const definitionExpressionRef = useRef<string>("");
  const availableFieldsRef = useRef<Set<string>>(new Set());
  const featureByIdRef = useRef<Map<string, any>>(new Map());
  const selectedPinObjectIdRef = useRef<number | null>(null);

  // ── Hotspot Analysis State ──────────────────────────────────────────────────
  const [showHotspotPanel, setShowHotspotPanel] = useState(false);
  const [hotspotCountySearch, setHotspotCountySearch] = useState("");
  const [hotspotCountySuggestions, setHotspotCountySuggestions] = useState<Array<{county: string; stAbbr: string}>>([]);
  const [hotspotSelectedCounty, setHotspotSelectedCounty] = useState<{county: string; stAbbr: string} | null>(null);
  const [hotspotSelectedFields, setHotspotSelectedFields] = useState<Set<string>>(new Set());
  const [hotspotLoading, setHotspotLoading] = useState(false);
  const [hotspotError, setHotspotError] = useState("");
  const [hotspotStatus, setHotspotStatus] = useState("");
  const [hotspotLayerActive, setHotspotLayerActive] = useState(false);
  const hotspotLayerRef = useRef<any>(null);

  const HOTSPOT_FIELDS = [
    { key: "E_POV150", label: "Poverty below 150%" },
    { key: "E_UNEMP", label: "Civilian 16+ Unemployed" },
    { key: "E_HBURD", label: "Housing Cost Burden" },
    { key: "E_NOHSDP", label: "No High School Diploma" },
    { key: "E_UNINSUR", label: "Uninsured" },
    { key: "E_AGE65", label: "Age 65+" },
    { key: "E_AGE17", label: "Age 17 and Under" },
    { key: "E_DISABL", label: "Disability" },
    { key: "E_SNGPNT", label: "Single-Parent Households" },
    { key: "E_NOVEH", label: "No Vehicle" },
  ];

  // ── Service Area (Isochrone) State ──────────────────────────────────────────
  const [serviceAreaMode, setServiceAreaMode] = useState(false);
  const [serviceAreaTravelMode, setServiceAreaTravelMode] = useState<"drive" | "walk">("drive");
  const serviceAreaTravelModeRef = useRef<"drive" | "walk">("drive");
  const [serviceAreaLoading, setServiceAreaLoading] = useState(false);
  const [serviceAreaError, setServiceAreaError] = useState("");
  const serviceAreaLayerRef = useRef<any>(null);
  const serviceAreaClickHandleRef = useRef<any>(null);
  const serviceAreaModulesRef = useRef<{ serviceArea: any; ServiceAreaParams: any; FeatureSet: any; Graphic: any; GraphicsLayer: any } | null>(null);

  const SERVICE_AREA_BREAKS = [5, 10, 20]; // minutes
  const SERVICE_AREA_COLORS = [
    "rgba(0, 154, 242, 0.35)",  // 5 min – blue
    "rgba(98, 150, 119, 0.30)", // 10 min – green
    "rgba(232, 93, 117, 0.25)", // 20 min – rose
  ];
  const SERVICE_AREA_URL =
    "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World";

  // ── Routing State ───────────────────────────────────────────────────────────
  const [routeMode, setRouteMode] = useState(false); // "waiting for origin click"
  const [routeDestination, setRouteDestination] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [routeTravelMode, setRouteTravelMode] = useState<"drive" | "walk">("drive");
  const routeTravelModeRef = useRef<"drive" | "walk">("drive");
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [routeResult, setRouteResult] = useState<{ minutes: number; miles: number; directions: string[] } | null>(null);
  const routeOriginRef = useRef<any>(null); // Store last origin point for recalculation
  const routeLayerRef = useRef<any>(null);
  const routeModulesRef = useRef<{ route: any; RouteParameters: any; networkService: any; FeatureSet: any; Graphic: any } | null>(null);
  const routeModeRef = useRef(false);
  const routeDestinationRef = useRef<{ lat: number; lon: number; name: string } | null>(null);
  const ROUTE_URL = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

  const activeFilterCount =
    (queryText.trim() ? 1 : 0) +
    (orgNameFilter.trim() ? 1 : 0) +
    (zipFilter.trim() ? 1 : 0) +
    (cityFilter.trim() ? 1 : 0) +
    (areaFilter.trim() ? 1 : 0) +
    (urgentOnly ? 1 : 0) +
    (staffingFilter !== "any" ? 1 : 0) +
    selectedResourceFilters.size +
    selectedSectorFilters.size;

  const hasField = (fieldName: string) => availableFieldsRef.current.has(fieldName.toUpperCase());

  const buildPinRenderer = () => ({
    type: "unique-value",
    field: PIN_SELECTED_FIELD,
    defaultSymbol: {
      type: "picture-marker",
      url: PIN_CIRCLE_URL,
      width: "26px",
      height: "26px",
      yoffset: "12px",
    },
    uniqueValueInfos: [
      {
        value: "1",
        label: "Selected",
        symbol: {
          type: "picture-marker",
          url: PIN_HEART_URL,
          width: "30px",
          height: "30px",
          yoffset: "14px",
        },
      },
    ],
  });

  const markSelectedPin = async (feature: any) => {
    const layer = sourceLayerRef.current;
    if (!layer || typeof layer.applyEdits !== "function") return;

    const objectIdField = String(layer.objectIdField || "ObjectId");
    const nextId = Number(
      feature?.attributes?.[objectIdField] ??
      feature?.attributes?.ObjectId ??
      feature?.attributes?.OBJECTID
    );
    if (!Number.isFinite(nextId)) return;

    const updates: any[] = [];

    if (selectedPinObjectIdRef.current !== null && selectedPinObjectIdRef.current !== nextId) {
      try {
        const previous = await layer.queryFeatures({
          where: `${objectIdField} = ${selectedPinObjectIdRef.current}`,
          outFields: [objectIdField, PIN_SELECTED_FIELD],
          returnGeometry: true,
          num: 1,
        });
        const prevFeature = previous?.features?.[0];
        if (prevFeature) {
          prevFeature.attributes = {
            ...prevFeature.attributes,
            [PIN_SELECTED_FIELD]: 0,
          };
          updates.push(prevFeature);
        }
      } catch {
        // Ignore previous reset failures and continue selecting the new pin.
      }
    }

    const nextFeature = feature?.clone ? feature.clone() : feature;
    nextFeature.attributes = {
      ...nextFeature.attributes,
      [PIN_SELECTED_FIELD]: 1,
    };
    updates.push(nextFeature);

    if (updates.length > 0) {
      await layer.applyEdits({ updateFeatures: updates });
    }
    selectedPinObjectIdRef.current = nextId;
  };

  // ── Service Area Helpers ────────────────────────────────────────────────────
  const clearServiceAreaGraphics = () => {
    const layer = serviceAreaLayerRef.current;
    if (layer) {
      layer.removeAll();
    }
  };

  const solveAndDisplayServiceArea = async (mapPoint: any) => {
    const modules = serviceAreaModulesRef.current;
    const view = mapViewRef.current;
    if (!modules || !view) return;

    const { serviceArea, ServiceAreaParams, FeatureSet, Graphic } = modules;

    setServiceAreaLoading(true);
    setServiceAreaError("");
    clearServiceAreaGraphics();

    // Add a pin graphic at the clicked location
    const pinGraphic = new Graphic({
      geometry: mapPoint,
      symbol: {
        type: "simple-marker",
        color: "#ffffff",
        size: 10,
        outline: { color: C.navy, width: 2 },
      },
    });
    serviceAreaLayerRef.current?.add(pinGraphic);

    try {
      // Load networkService module and fetch service description for travel modes
      const [networkService] = await new Promise<any[]>((resolve, reject) => {
        window.require!(
          ["esri/rest/networkService"],
          (...mods: any[]) => resolve(mods),
          reject
        );
      });

      const networkDescription = await networkService.fetchServiceDescription(SERVICE_AREA_URL);
      const isWalk = serviceAreaTravelModeRef.current === "walk";
      const travelMode = networkDescription.supportedTravelModes.find(
        (mode: any) => mode.name === (isWalk ? "Walking Time" : "Driving Time")
      );

      const featureSet = new FeatureSet({
        features: [pinGraphic],
      });

      const params = new ServiceAreaParams({
        facilities: featureSet,
        defaultBreaks: SERVICE_AREA_BREAKS,
        travelMode,
        outSpatialReference: view.spatialReference,
        trimOuterPolygon: true,
      });

      const result = await serviceArea.solve(SERVICE_AREA_URL, params);

      if (result.serviceAreaPolygons?.features?.length) {
        // ArcGIS returns polygons largest-first (20, 10, 5 min).
        // Draw in reverse so smallest (5 min) ends up on top visually.
        // Map colors so index 0 in COLORS (blue) → smallest break (5 min).
        const features = result.serviceAreaPolygons.features;
        const lastIdx = features.length - 1;
        for (let i = features.length - 1; i >= 0; i--) {
          const graphic = features[i];
          const colorIdx = lastIdx - i; // flip: largest polygon → last color, smallest → first
          graphic.symbol = {
            type: "simple-fill",
            color: SERVICE_AREA_COLORS[colorIdx] || "rgba(100,100,100,0.2)",
            outline: {
              color: SERVICE_AREA_COLORS[colorIdx]?.replace(/[\d.]+\)$/, "0.8)") || "rgba(100,100,100,0.8)",
              width: 1.5,
            },
          };
          serviceAreaLayerRef.current?.add(graphic);
        }
      }
    } catch (err: any) {
      console.error("Service area error:", err);
      setServiceAreaError(err?.message || "Failed to calculate service area");
    } finally {
      setServiceAreaLoading(false);
    }
  };

  // ── Routing Helpers ─────────────────────────────────────────────────────────
  const clearRoute = () => {
    const layer = routeLayerRef.current;
    if (layer) {
      layer.removeAll();
    }
    routeOriginRef.current = null;
    setRouteResult(null);
    setRouteError("");
  };

  const solveAndDisplayRoute = async (originPoint: any) => {
    const modules = routeModulesRef.current;
    const view = mapViewRef.current;
    const destination = routeDestinationRef.current;
    if (!modules || !view || !destination) return;

    // Store origin for recalculation when travel mode changes
    routeOriginRef.current = originPoint;

    const { route, RouteParameters, networkService, FeatureSet, Graphic } = modules;

    setRouteLoading(true);
    setRouteError("");
    setRouteResult(null);
    // Clear previous route graphics (but keep originRef intact for recalculation)
    if (routeLayerRef.current) {
      routeLayerRef.current.removeAll();
    }

    // Add origin pin
    const originGraphic = new Graphic({
      geometry: originPoint,
      symbol: {
        type: "simple-marker",
        color: C.blue,
        size: 12,
        outline: { color: "#fff", width: 2 },
      },
    });
    routeLayerRef.current?.add(originGraphic);

    // Add destination pin
    const destGraphic = new Graphic({
      geometry: { type: "point", longitude: destination.lon, latitude: destination.lat },
      symbol: {
        type: "simple-marker",
        color: C.rose,
        size: 12,
        outline: { color: "#fff", width: 2 },
      },
    });
    routeLayerRef.current?.add(destGraphic);

    try {
      // Get travel mode from network service description
      const networkDescription = await networkService.fetchServiceDescription(ROUTE_URL);
      const isWalk = routeTravelModeRef.current === "walk";
      const travelMode = networkDescription.supportedTravelModes.find(
        (mode: any) => mode.name === (isWalk ? "Walking Time" : "Driving Time")
      );

      const routeParams = new RouteParameters({
        stops: new FeatureSet({
          features: [originGraphic, destGraphic],
        }),
        travelMode,
        returnDirections: true,
        outSpatialReference: view.spatialReference,
      });

      const result = await route.solve(ROUTE_URL, routeParams);

      if (result.routeResults?.length) {
        const routeResult = result.routeResults[0];
        const routeGraphic = routeResult.route;

        // Draw the route line
        routeGraphic.symbol = {
          type: "simple-line",
          color: isWalk ? C.green : C.blue,
          width: 4,
          style: "solid",
        };
        routeLayerRef.current?.add(routeGraphic);

        // Extract directions
        const directions = routeResult.directions?.features?.map(
          (f: any) => f.attributes?.text
        ).filter(Boolean) || [];

        const totalTime = routeResult.route?.attributes?.Total_TravelTime
          ?? routeResult.directions?.totalLength
          ?? 0;
        const totalMiles = routeResult.route?.attributes?.Total_Miles
          ?? routeResult.route?.attributes?.Total_Kilometers * 0.621371
          ?? 0;

        setRouteResult({
          minutes: Math.round(totalTime),
          miles: Math.round(totalMiles * 10) / 10,
          directions,
        });

        // Zoom to the route extent
        if (routeGraphic.geometry?.extent) {
          await view.goTo(routeGraphic.geometry.extent.expand(1.3));
        }
      }
    } catch (err: any) {
      console.error("Route error:", err);
      setRouteError(err?.message || "Failed to calculate route");
    } finally {
      setRouteLoading(false);
      setRouteMode(false);
      routeModeRef.current = false;
    }
  };

  const buildDefinitionExpression = () => {
    const clauses: string[] = [];
    const q = queryText.trim();

    if (q) {
      const qEsc = escapeSql(q.toUpperCase());
      const qParts = [
        `UPPER(Company_Business_Name) LIKE '%${qEsc}%'`,
        `UPPER(City) LIKE '%${qEsc}%'`,
        `UPPER(Mission_Area) LIKE '%${qEsc}%'`,
        `UPPER(Esri_Category_Description) LIKE '%${qEsc}%'`,
        // Item fields – what orgs OFFER
        `UPPER(Offer_Bedding_Items) LIKE '%${qEsc}%'`,
        `UPPER(Offer_Food_Items) LIKE '%${qEsc}%'`,
        `UPPER(Offer_Clothes_Items) LIKE '%${qEsc}%'`,
        `UPPER(Offer_Toiletries_Items) LIKE '%${qEsc}%'`,
        `UPPER(Offer_Furniture_Items) LIKE '%${qEsc}%'`,
        `UPPER(Offer_Medical_Supplies_Items) LIKE '%${qEsc}%'`,
        `UPPER(Offer_Shelter_Items) LIKE '%${qEsc}%'`,
        `UPPER(Offer_Electronics_Items) LIKE '%${qEsc}%'`,
        `UPPER(Offer_Education_Materials_Items) LIKE '%${qEsc}%'`,
        `UPPER(Offer_Baby_Items_Items) LIKE '%${qEsc}%'`,
        `UPPER(Offer_Cleaning_Items_Items) LIKE '%${qEsc}%'`,
        // Item fields – what orgs NEED
        `UPPER(Bedding_Text) LIKE '%${qEsc}%'`,
        `UPPER(Food_Text) LIKE '%${qEsc}%'`,
        `UPPER(Clothes_Text) LIKE '%${qEsc}%'`,
        `UPPER(Toiletries_Text) LIKE '%${qEsc}%'`,
        `UPPER(Furniture_Text) LIKE '%${qEsc}%'`,
        `UPPER(Medical_Supplies_Text) LIKE '%${qEsc}%'`,
        `UPPER(Shelter_Text) LIKE '%${qEsc}%'`,
        `UPPER(Electronics_Text) LIKE '%${qEsc}%'`,
        `UPPER(Education_Materials_Text) LIKE '%${qEsc}%'`,
        `UPPER(Baby_Items_Text) LIKE '%${qEsc}%'`,
        `UPPER(Cleaning_Items_Text) LIKE '%${qEsc}%'`,
      ];
      const digits = q.replace(/[^0-9]/g, "");
      if (digits) {
        qParts.push(`ZIP_Code = ${Number(digits)}`);
      }
      clauses.push(`(${qParts.join(" OR ")})`);
    }

    if (orgNameFilter.trim()) {
      const v = escapeSql(orgNameFilter.trim().toUpperCase());
      clauses.push(`UPPER(Company_Business_Name) LIKE '%${v}%'`);
    }

    if (zipFilter.trim()) {
      const digits = zipFilter.replace(/[^0-9]/g, "");
      if (digits) {
        clauses.push(`ZIP_Code = ${Number(digits)}`);
      }
    }

    if (cityFilter.trim()) {
      const v = escapeSql(cityFilter.trim().toUpperCase());
      clauses.push(`UPPER(City) LIKE '%${v}%'`);
    }

    if (areaFilter.trim()) {
      const v = escapeSql(areaFilter.trim().toUpperCase());
      clauses.push(`(UPPER(Mission_Area) LIKE '%${v}%' OR UPPER(Esri_Category_Description) LIKE '%${v}%')`);
    }

    if (staffingFilter === "needed") {
      clauses.push(`UPPER(Need_Volunteers) = 'YES'`);
    }
    if (staffingFilter === "not-needed") {
      clauses.push(`(Need_Volunteers IS NULL OR UPPER(Need_Volunteers) <> 'YES')`);
    }

    if (urgentOnly) {
      // Show only orgs that have at least one urgent need
      const urgentFields = [
        "Bedding_Urgent", "Food_Urgent", "Clothes_Urgent", "Toiletries_Urgent",
        "Furniture_Urgent", "Medical_Supplies_Urgent", "Shelter_Urgent",
        "Electronics_Urgent", "Education_Materials_Urgent", "Baby_Items_Urgent",
        "Cleaning_Items_Urgent",
      ].filter((f) => hasField(f));
      if (urgentFields.length > 0) {
        const urgentClauses = urgentFields.map((f) => `UPPER(${f}) = 'YES'`);
        clauses.push(`(${urgentClauses.join(" OR ")})`);
      }
    }

    if (selectedResourceFilters.size > 0) {
      const selectedKeys = new Set(selectedResourceFilters);
      const resourceClauses = RESOURCE_FILTERS
        .filter((item) => selectedKeys.has(item.key))
        .map((item) => {
          const sourceClauses: string[] = [];
          if (hasField(item.ynField)) {
            sourceClauses.push(`UPPER(${item.ynField}) = 'YES'`);
          }
          if (item.legacyOfferField && hasField(item.legacyOfferField)) {
            sourceClauses.push(`UPPER(${item.legacyOfferField}) = 'YES'`);
          }
          if (hasField(item.textField)) {
            sourceClauses.push(`(${item.textField} IS NOT NULL AND ${item.textField} <> '')`);
          }
          const keywordClauses = item.keywords.map((kw) => {
            const v = escapeSql(kw.toUpperCase());
            return `UPPER(Mission_Area) LIKE '%${v}%' OR UPPER(Esri_Category_Description) LIKE '%${v}%' OR UPPER(Organization_Description) LIKE '%${v}%'`;
          });
          return `(${[...sourceClauses, ...keywordClauses].join(" OR ")})`;
        });
      if (resourceClauses.length > 0) {
        clauses.push(`(${resourceClauses.join(" OR ")})`);
      }
    }

    if (selectedSectorFilters.size > 0) {
      const sectorClauses = [...selectedSectorFilters].map((tag) => {
        const t = escapeSql(tag.toUpperCase());
        return `(UPPER(Mission_Area) LIKE '%${t}%' OR UPPER(Esri_Category_Description) LIKE '%${t}%')`;
      });
      clauses.push(`(${sectorClauses.join(" OR ")})`);
    }

    if (urgentOnly) {
      const urgentFields = [
        "Food_Urgent",
        "Clothes_Urgent",
        "Shelter_Urgent",
        "Bedding_Urgent",
        "Toiletries_Urgent",
        "Furniture_Urgent",
        "Medical_Supplies_Urgent",
        "Electronics_Urgent",
        "Education_Materials_Urgent",
        "Baby_Items_Urgent",
        "Cleaning_Items_Urgent",
      ].filter(hasField);

      if (urgentFields.length > 0) {
        clauses.push(`(${urgentFields.map((field) => `UPPER(${field}) = 'YES'`).join(" OR ")})`);
      } else {
        clauses.push(`(UPPER(Organization_Description) LIKE '%URGENT%' OR UPPER(Mission_Area) LIKE '%URGENT%')`);
      }
    }

    return clauses.join(" AND ");
  };

  const mapFeatureToResult = (feature: any, index: number): ArcgisOrgResult | null => {
    const attrs = feature?.attributes || {};
    const geometry = feature?.geometry;
    if (!geometry) {
      return null;
    }

    const id = String(attrs.ObjectId ?? attrs.OBJECTID ?? attrs.objectid ?? `org-${index}`);
    const name = String(attrs.Company_Business_Name || attrs.name || "Organization");
    const city = String(attrs.City || "");
    const zip = String(attrs.ZIP_Code ?? "");
    const missionArea = String(attrs.Mission_Area || attrs.Esri_Category_Description || "");
    const address = String(attrs.Address__ || attrs.Matched_Address || attrs.address || "Address unavailable");
    const volunteersNeeded = isYes(attrs.Need_Volunteers);

    const categoriesSet = new Set<string>();
    const textBlob = `${attrs.Mission_Area || ""} ${attrs.Esri_Category_Description || ""} ${attrs.Organization_Description || ""}`.toLowerCase();
    RESOURCE_FILTERS.forEach((item) => {
      const matchesKeyword = item.keywords.some((kw) => textBlob.includes(kw));
      if (isYes(attrs[item.ynField]) || isYes(attrs[item.legacyOfferField]) || parseListText(attrs[item.textField]).length > 0 || matchesKeyword) {
        categoriesSet.add(item.label);
      }
    });

    DONATION_NEED_SIGNALS.forEach((signal) => {
      const matchesKeyword = signal.keywords.some((kw) => textBlob.includes(kw));
      if (isYes(attrs[signal.ynField]) || isYes(attrs[signal.legacyOfferField]) || parseListText(attrs[signal.textField]).length > 0 || matchesKeyword) {
        categoriesSet.add(signal.label);
      }
    });

    if (categoriesSet.size === 0) {
      if (textBlob.includes("health") || textBlob.includes("clinic") || textBlob.includes("medical")) {
        categoriesSet.add("Medical Supplies");
      }
      if (textBlob.includes("education") || textBlob.includes("school") || textBlob.includes("youth")) {
        categoriesSet.add("Education Materials");
      }
      if (textBlob.includes("housing") || textBlob.includes("shelter") || textBlob.includes("homeless")) {
        categoriesSet.add("Furniture");
        categoriesSet.add("Bedding");
      }
      if (textBlob.includes("food") || textBlob.includes("pantry") || textBlob.includes("meal")) {
        categoriesSet.add("Food");
      }
      if (textBlob.includes("clothing") || textBlob.includes("closet")) {
        categoriesSet.add("Clothes");
      }
      if (textBlob.includes("baby") || textBlob.includes("infant") || textBlob.includes("family")) {
        categoriesSet.add("Baby Items");
      }
    }

    const categories = Array.from(categoriesSet);

    return {
      id,
      name,
      city,
      zip,
      missionArea,
      address,
      volunteersNeeded,
      categories,
      feature,
    };
  };

  const toRegistrationGraphic = (Graphic: any, row: RegistrationMapRow, objectId: number) => {
    if (!Graphic) return null;

    if (!Number.isFinite(Number(row.latitude)) || !Number.isFinite(Number(row.longitude))) {
      return null;
    }

    const attrs = {
      ObjectId: objectId,
      Registration_Id: row.id,
      Company_Business_Name: row.organizationName,
      Organization_Name: row.organizationName,
      Address__: row.address,
      Address: row.address,
      City: row.city,
      ZIP_Code: row.zip,
      Mission_Area: row.missionArea,
      Main_Contact: row.mainContact,
      Contact_Email: row.contactEmail,
      Website_Link: row.websiteLink,
      Working_Hours: row.workingHours,
      Organization_Description: row.description,
      Need_Volunteers: row.needVolunteers,
      Food_Y_N: row.foodYN,
      Food_Text: row.foodText,
      Clothes_Y_N: row.clothesYN,
      Clothes_Text: row.clothesText,
      Shelter_Y_N: row.shelterYN,
      Shelter_Text: row.shelterText,
      Bedding_Y_N: row.beddingYN,
      Bedding_Text: row.beddingText,
      Toiletries_Y_N: row.toiletriesYN,
      Toiletries_Text: row.toiletriesText,
      Furniture_Y_N: row.furnitureYN,
      Furniture_Text: row.furnitureText,
      Medical_Supplies_Y_N: row.medicalSuppliesYN,
      Medical_Supplies_Text: row.medicalSuppliesText,
      Electronics_Y_N: row.electronicsYN,
      Electronics_Text: row.electronicsText,
      Education_Materials_Y_N: row.educationMaterialsYN,
      Education_Materials_Text: row.educationMaterialsText,
      Baby_Items_Y_N: row.babyItemsYN,
      Baby_Items_Text: row.babyItemsText,
      Cleaning_Items_Y_N: row.cleaningItemsYN,
      Cleaning_Items_Text: row.cleaningItemsText,
      Latitude: Number(row.latitude),
      Longitude: Number(row.longitude),
    };

    return new Graphic({
      geometry: {
        type: "point",
        longitude: Number(row.longitude),
        latitude: Number(row.latitude),
      },
      attributes: attrs,
    });
  };

  const refreshResults = async () => {
    const sourceLayer = sourceLayerRef.current;

    setIsLoading(true);
    setError("");
    try {
      const where = definitionExpressionRef.current || sourceLayer?.definitionExpression || "1=1";
      let features: any[] = [];
      if (sourceLayer) {
        const featureSet = await sourceLayer.queryFeatures({
          where,
          outFields: ["*"],
          returnGeometry: true,
          num: 2000,
        });
        features = featureSet.features || [];
      }

      featureByIdRef.current.clear();
      const nextResults = features
        .map(mapFeatureToResult)
        .filter((item): item is ArcgisOrgResult => item !== null);

      nextResults.forEach((item) => {
        featureByIdRef.current.set(item.id, item.feature);
      });

      setResults(nextResults);
    } catch {
      setError("Could not load organizations from ArcGIS.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    const expression = buildDefinitionExpression();
    definitionExpressionRef.current = expression;

    const layer = sourceLayerRef.current;
    if (layer) {
      layer.definitionExpression = expression;
    }
    await refreshResults();
  };

  const resetFilters = async () => {
    setQueryText("");
    setOrgNameFilter("");
    setZipFilter("");
    setCityFilter("");
    setAreaFilter("");
    setUrgentOnly(false);
    setStaffingFilter("any");
    setSelectedResourceFilters(new Set());
    setSelectedSectorFilters(new Set());
    setSelectedOrgId(null);
    setDetailOrg(null);

    const layer = sourceLayerRef.current;
    definitionExpressionRef.current = "";

    if (layer) {
      layer.definitionExpression = "";
    }
    await refreshResults();
  };

  const zoomToResult = async (org: ArcgisOrgResult) => {
    const view = mapViewRef.current;
    const layer = sourceLayerRef.current;
    const sourceFeature = featureByIdRef.current.get(org.id);
    if (!view || !sourceFeature) return;

    setSelectedOrgId(org.id);
    setDetailOrg(org);
    try {
      await view.goTo({ target: sourceFeature, zoom: 13 }, { animate: false });
    } catch {
      // Keep popup/card sync working even if goTo animation fails.
    }

    if (layer) {
      try {
        const oid = Number(org.id);
        const popupFeatures = await layer.queryFeatures({
          where: Number.isFinite(oid) ? `ObjectId = ${oid}` : `Company_Business_Name = '${escapeSql(org.name)}'`,
          outFields: ["*"],
          returnGeometry: true,
          num: 1,
        });
        const topFeature = popupFeatures?.features?.[0];
        if (topFeature) {
          view.popup.open({ features: [topFeature], location: topFeature.geometry });
          return;
        }
      } catch {
        // Fall back to opening with cached query feature.
      }
    }

    view.popup.open({ features: [sourceFeature], location: sourceFeature.geometry });
  };

  const toggleResourceFilter = (itemKey: string) => {
    setSelectedResourceFilters((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  const toggleSectorFilter = (tag: string) => {
    setSelectedSectorFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  // ── Hotspot Analysis Logic ──────────────────────────────────────────────────
  const SVI_LAYER_URL = "https://services8.arcgis.com/LLNIdHmmdjO2qQ5q/arcgis/rest/services/Vulnerable_Population_Estimates/FeatureServer/0";

  const hotspotCountySearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHotspotCountySearch = (value: string) => {
    setHotspotCountySearch(value);
    if (hotspotCountySearchDebounceRef.current) {
      clearTimeout(hotspotCountySearchDebounceRef.current);
    }
    if (!value.trim()) {
      setHotspotCountySuggestions([]);
      return;
    }
    hotspotCountySearchDebounceRef.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(value.trim().toUpperCase());
        const url = `${SVI_LAYER_URL}/query?where=UPPER(COUNTY)+LIKE+'%25${encoded}%25'&outFields=COUNTY,ST_ABBR&returnDistinctValues=true&returnGeometry=false&resultRecordCount=20&f=json`;
        const res = await fetch(url);
        const data = await res.json();
        const features = data.features || [];
        const seen = new Set<string>();
        const suggestions: Array<{county: string; stAbbr: string}> = [];
        for (const f of features) {
          const key = `${f.attributes.COUNTY}|${f.attributes.ST_ABBR}`;
          if (!seen.has(key)) {
            seen.add(key);
            suggestions.push({ county: f.attributes.COUNTY, stAbbr: f.attributes.ST_ABBR });
          }
        }
        setHotspotCountySuggestions(suggestions);
      } catch {
        setHotspotCountySuggestions([]);
      }
    }, 300);
  };

  const selectHotspotCounty = (item: {county: string; stAbbr: string}) => {
    setHotspotSelectedCounty(item);
    setHotspotCountySearch("");
    setHotspotCountySuggestions([]);
  };

  const clearHotspotCounty = () => {
    setHotspotSelectedCounty(null);
    setHotspotSelectedFields(new Set());
    clearHotspotLayer();
  };

  const toggleHotspotField = (fieldKey: string) => {
    setHotspotSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  };

  const clearHotspotLayer = () => {
    if (hotspotLayerRef.current && mapViewRef.current) {
      mapViewRef.current.map.remove(hotspotLayerRef.current);
      hotspotLayerRef.current = null;
    }
    setHotspotLayerActive(false);
    setHotspotStatus("");
    setHotspotError("");
  };

  const runHotspotAnalysis = async () => {
    if (!hotspotSelectedCounty || hotspotSelectedFields.size === 0) return;

    setHotspotLoading(true);
    setHotspotError("");
    setHotspotStatus("Submitting analysis job...");
    clearHotspotLayer();

    try {
      const res = await fetch("/api/donor/hotspot-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          county: hotspotSelectedCounty.county,
          stAbbr: hotspotSelectedCounty.stAbbr,
          analysisFields: Array.from(hotspotSelectedFields),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${res.status}`);
      }

      setHotspotStatus("Processing results...");
      const data = await res.json();
      await renderHotspotResults(data);
      setHotspotStatus("Analysis complete");
    } catch (err: any) {
      setHotspotError(err?.message || "Hotspot analysis failed");
      setHotspotStatus("");
    } finally {
      setHotspotLoading(false);
    }
  };

  const renderHotspotResults = async (data: any) => {
    if (!mapViewRef.current || !window.require) return;

    const [FeatureLayer, Graphic, Polygon] = await new Promise<any[]>((resolve, reject) => {
      window.require!(
        ["esri/layers/FeatureLayer", "esri/Graphic", "esri/geometry/Polygon"],
        (...modules: any[]) => resolve(modules),
        reject
      );
    });

    const featureCollection = data.result;
    if (!featureCollection) {
      setHotspotError("No result data returned from analysis");
      console.error("[Hotspot] data.result is empty:", data);
      return;
    }

    // The result could be { featureSet, layerDefinition } or { url } or nested differently
    // Log for debugging
    console.log("[Hotspot] Raw result structure:", JSON.stringify(Object.keys(featureCollection)));
    console.log("[Hotspot] featureSet keys:", featureCollection.featureSet ? Object.keys(featureCollection.featureSet) : "NO featureSet");

    const featureSet = featureCollection.featureSet;
    if (!featureSet?.features?.length) {
      setHotspotError("No features in the analysis result. Check console for details.");
      console.error("[Hotspot] featureCollection:", featureCollection);
      return;
    }

    const layerDef = featureCollection.layerDefinition || {};

    // Log first feature to understand geometry and attribute structure
    console.log("[Hotspot] First feature attributes:", JSON.stringify(featureSet.features[0]?.attributes));
    console.log("[Hotspot] First feature geometry keys:", featureSet.features[0]?.geometry ? Object.keys(featureSet.features[0].geometry) : "NO geometry");
    console.log("[Hotspot] spatialReference:", JSON.stringify(featureSet.spatialReference || featureSet.features[0]?.geometry?.spatialReference));
    console.log("[Hotspot] Feature count:", featureSet.features.length);

    // Determine the confidence bin field name (varies by response)
    const sampleAttrs = featureSet.features[0]?.attributes || {};
    const confidenceBinField =
      "Confidence_Bin" in sampleAttrs ? "Confidence_Bin" :
      "Gi_Bin" in sampleAttrs ? "Gi_Bin" :
      Object.keys(sampleAttrs).find((k) => /bin/i.test(k)) || null;

    console.log("[Hotspot] Detected confidence bin field:", confidenceBinField);
    if (confidenceBinField) {
      console.log("[Hotspot] Sample bin value:", sampleAttrs[confidenceBinField], "type:", typeof sampleAttrs[confidenceBinField]);
    }

    // Determine spatial reference from the featureSet or features
    const sr = featureSet.spatialReference ||
      featureSet.features[0]?.geometry?.spatialReference ||
      { wkid: 102100 };

    const graphics: any[] = [];
    for (let i = 0; i < featureSet.features.length; i++) {
      const f = featureSet.features[i];
      if (!f.geometry || !f.geometry.rings) {
        console.warn(`[Hotspot] Feature ${i} has no rings, skipping`);
        continue;
      }

      const geom = new Polygon({
        rings: f.geometry.rings,
        spatialReference: f.geometry.spatialReference || sr,
      });

      graphics.push(new Graphic({
        geometry: geom,
        attributes: { ...f.attributes, OBJECTID: f.attributes.OBJECTID ?? f.attributes.FID ?? i },
      }));
    }

    if (graphics.length === 0) {
      setHotspotError("All features had invalid geometry");
      return;
    }

    console.log("[Hotspot] Created", graphics.length, "graphics");

    const fields = (layerDef.fields || []).map((f: any) => ({
      name: f.name,
      alias: f.alias || f.name,
      type: f.type === "esriFieldTypeDouble" ? "double" :
            f.type === "esriFieldTypeInteger" ? "integer" :
            f.type === "esriFieldTypeSmallInteger" ? "small-integer" :
            f.type === "esriFieldTypeString" ? "string" :
            f.type === "esriFieldTypeOID" ? "oid" : "string",
    }));

    // Ensure OBJECTID field exists
    if (!fields.find((f: any) => f.name === "OBJECTID")) {
      fields.unshift({ name: "OBJECTID", alias: "OBJECTID", type: "oid" });
    }

    // Ensure the confidence bin field is in the fields list
    if (confidenceBinField && !fields.find((f: any) => f.name === confidenceBinField)) {
      fields.push({ name: confidenceBinField, alias: confidenceBinField, type: "integer" });
    }

    // If no layerDefinition fields came back, build fields from sample attributes
    if (fields.length <= 1) {
      for (const key of Object.keys(sampleAttrs)) {
        if (key === "OBJECTID") continue;
        const val = sampleAttrs[key];
        fields.push({
          name: key,
          alias: key,
          type: typeof val === "number" ? (Number.isInteger(val) ? "integer" : "double") : "string",
        });
      }
    }

    const renderer = confidenceBinField ? {
      type: "unique-value",
      field: confidenceBinField,
      defaultSymbol: { type: "simple-fill", color: [245, 235, 220, 100], outline: { color: [200, 200, 200, 80], width: 0.5 } },
      uniqueValueInfos: [
        { value: "3", symbol: { type: "simple-fill", color: [180, 0, 0, 200], outline: { color: [120, 0, 0, 200], width: 0.5 } }, label: "Hot Spot (99% Confidence)" },
        { value: "2", symbol: { type: "simple-fill", color: [240, 60, 60, 180], outline: { color: [180, 40, 40, 180], width: 0.5 } }, label: "Hot Spot (95% Confidence)" },
        { value: "1", symbol: { type: "simple-fill", color: [255, 140, 140, 150], outline: { color: [220, 100, 100, 150], width: 0.5 } }, label: "Hot Spot (90% Confidence)" },
        { value: "0", symbol: { type: "simple-fill", color: [245, 235, 220, 100], outline: { color: [200, 200, 200, 80], width: 0.5 } }, label: "Not Significant" },
        { value: "-1", symbol: { type: "simple-fill", color: [140, 140, 255, 150], outline: { color: [100, 100, 220, 150], width: 0.5 } }, label: "Cold Spot (90% Confidence)" },
        { value: "-2", symbol: { type: "simple-fill", color: [60, 60, 240, 180], outline: { color: [40, 40, 180, 180], width: 0.5 } }, label: "Cold Spot (95% Confidence)" },
        { value: "-3", symbol: { type: "simple-fill", color: [0, 0, 180, 200], outline: { color: [0, 0, 120, 200], width: 0.5 } }, label: "Cold Spot (99% Confidence)" },
      ],
    } : {
      // Fallback: just render everything with a solid color so we can at least SEE it
      type: "simple",
      symbol: { type: "simple-fill", color: [255, 0, 0, 150], outline: { color: [200, 0, 0, 200], width: 1 } },
    };

    const hotspotLayer = new FeatureLayer({
      source: graphics,
      objectIdField: "OBJECTID",
      fields,
      geometryType: "polygon",
      spatialReference: sr,
      opacity: 0.5,
      title: `Hotspot Analysis: ${hotspotSelectedCounty?.county}, ${hotspotSelectedCounty?.stAbbr}`,
      renderer,
    });

    mapViewRef.current.map.add(hotspotLayer, 0); // Add below the nonprofit feature layer
    hotspotLayerRef.current = hotspotLayer;
    setHotspotLayerActive(true);

    // Zoom to the results extent
    try {
      const extent = await hotspotLayer.queryExtent({ where: "1=1" });
      console.log("[Hotspot] Layer extent:", JSON.stringify(extent?.extent?.toJSON?.() || extent));
      if (extent?.extent) {
        await mapViewRef.current.goTo(extent.extent.expand(1.1));
      }
    } catch {
      // Non-critical
    }
  };

  const selectedOrg = detailOrg ?? results.find((item) => item.id === selectedOrgId) ?? null;

  const selectedOrgAttrs = (selectedOrg?.feature?.attributes || {}) as Record<string, unknown>;
  const donationNeedDetails = useMemo(
    () => getDonationNeedDetails(selectedOrgAttrs),
    [selectedOrgAttrs]
  );

  const keyInfoRows = useMemo(() => {
    if (!selectedOrg) return [] as Array<{ label: string; value: string }>;

    return [
      { label: "Organization", value: selectedOrg.name || "Not provided" },
      { label: "Address", value: selectedOrg.address || "Not provided" },
      { label: "City", value: selectedOrg.city || "Not provided" },
      { label: "ZIP", value: selectedOrg.zip || "Not provided" },
      { label: "Mission Area", value: String(selectedOrgAttrs.Mission_Area || selectedOrg.missionArea || "Not provided") },
      { label: "Volunteers", value: selectedOrg.volunteersNeeded ? "Needed" : "Not needed" },
      { label: "Main Contact", value: String(selectedOrgAttrs.Main_Contact || selectedOrgAttrs.Contact_Name || "Not provided") },
      { label: "Contact Email", value: String(selectedOrgAttrs.Contact_Email || "Not provided") },
      { label: "Website", value: String(selectedOrgAttrs.Website_Link || "Not provided") },
      { label: "Hours", value: String(selectedOrgAttrs.Working_Hours || "Not provided") },
      { label: "Description", value: String(selectedOrgAttrs.Organization_Description || "Not provided") },
    ];
  }, [selectedOrg, selectedOrgAttrs]);

  const allAttributeRows = useMemo(() => {
    return Object.entries(selectedOrgAttrs)
      .filter(([key, value]) => {
        if (["ObjectId", "Latitude", "Longitude"].includes(key)) return false;
        if (value === null || value === undefined) return false;
        if (typeof value === "string" && value.trim() === "") return false;
        return true;
      })
      .map(([key, value]) => ({
        label: prettifyFieldName(key),
        value: String(value),
      }));
  }, [selectedOrgAttrs]);

  useEffect(() => {
    if (!mapContainerRef.current || mapViewRef.current) {
      return;
    }

    let view: any = null;
    let popupSelectedHandle: { remove: () => void } | null = null;

    ensureRuntimeConfig()
      .then(() => loadArcgisModules())
      .then(async ([esriConfig, ArcGISMap, FeatureLayer, MapView, LayerList, _Search, serviceAreaModule, ServiceAreaParams, FeatureSetModule, GraphicModule, GraphicsLayer, routeModule, RouteParameters, networkServiceModule]) => {
        const apiKey = window.__APP_CONFIG?.arcgisApiKey;
        if (apiKey) {
          esriConfig.apiKey = apiKey;
        }

        const itemParams = new URLSearchParams({ f: "json" });
        if (apiKey) {
          itemParams.set("token", apiKey);
        }
        const itemResponse = await fetch(
          `https://www.arcgis.com/sharing/rest/content/items/${DONOR_FEATURE_LAYER_ITEM_ID}?${itemParams.toString()}`
        );
        const itemPayload = await itemResponse.json();
        const itemBaseUrl = String(itemPayload?.url || "").replace(/\/+$/, "");
        const layerUrl = itemBaseUrl ? `${itemBaseUrl}/0` : "";

        const clusterConfig = {
          type: "cluster",
          clusterRadius: "80px",
          clusterMinSize: "22px",
          clusterMaxSize: "56px",
          labelingInfo: [{
            deconflictionStrategy: "none",
            labelExpressionInfo: { expression: "$feature.cluster_count" },
            symbol: {
              type: "text",
              color: "#ffffff",
              font: { size: "11px", weight: "bold" },
              haloColor: C.navy,
              haloSize: "1px",
            },
            labelPlacement: "center-center",
          }],
          symbol: {
            type: "simple-marker",
            style: "circle",
            color: C.rose,
            outline: { color: "#ffffff", width: 1.5 },
          },
        } as const;

        const sourceLayer = new FeatureLayer({
          ...(layerUrl
            ? { url: layerUrl }
            : { portalItem: { id: DONOR_FEATURE_LAYER_ITEM_ID } }),
          title: "Non-Profit Locations",
          outFields: ["*"],
          popupEnabled: true,
          featureReduction: clusterConfig,
        });

        await sourceLayer.load();
        availableFieldsRef.current = new Set((sourceLayer.fields || []).map((field: any) => String(field?.name || "").toUpperCase()));
        const loadedLayerUrl = String(sourceLayer.url || "");
        if (layerUrl) {
          layerQueryUrlRef.current = layerUrl;
        } else if (/\/FeatureServer\/\d+$/i.test(loadedLayerUrl)) {
          layerQueryUrlRef.current = loadedLayerUrl;
        }
        sourceLayer.popupTemplate = {
          title: "{Company_Business_Name}",
          content: [{
            type: "fields",
            fieldInfos: [
              // Contact info
              { fieldName: "Contact_Email", label: "Email", visible: true },
              { fieldName: "Website_Link", label: "Website", visible: true },
              { fieldName: "Working_Hours", label: "Hours", visible: true },
              // Items they OFFER
              { fieldName: "Offer_Bedding_Items", label: "Offers: Bedding", visible: true },
              { fieldName: "Offer_Food_Items", label: "Offers: Food", visible: true },
              { fieldName: "Offer_Clothes_Items", label: "Offers: Clothes", visible: true },
              { fieldName: "Offer_Toiletries_Items", label: "Offers: Toiletries", visible: true },
              { fieldName: "Offer_Furniture_Items", label: "Offers: Furniture", visible: true },
              { fieldName: "Offer_Medical_Supplies_Items", label: "Offers: Medical Supplies", visible: true },
              { fieldName: "Offer_Shelter_Items", label: "Offers: Shelter", visible: true },
              { fieldName: "Offer_Electronics_Items", label: "Offers: Electronics", visible: true },
              { fieldName: "Offer_Education_Materials_Items", label: "Offers: Education Materials", visible: true },
              { fieldName: "Offer_Baby_Items_Items", label: "Offers: Baby Items", visible: true },
              { fieldName: "Offer_Cleaning_Items_Items", label: "Offers: Cleaning Items", visible: true },
              // Items they NEED
              { fieldName: "Bedding_Text", label: "Needs: Bedding", visible: true },
              { fieldName: "Food_Text", label: "Needs: Food", visible: true },
              { fieldName: "Clothes_Text", label: "Needs: Clothes", visible: true },
              { fieldName: "Toiletries_Text", label: "Needs: Toiletries", visible: true },
              { fieldName: "Furniture_Text", label: "Needs: Furniture", visible: true },
              { fieldName: "Medical_Supplies_Text", label: "Needs: Medical Supplies", visible: true },
              { fieldName: "Shelter_Text", label: "Needs: Shelter", visible: true },
              { fieldName: "Electronics_Text", label: "Needs: Electronics", visible: true },
              { fieldName: "Education_Materials_Text", label: "Needs: Education Materials", visible: true },
              { fieldName: "Baby_Items_Text", label: "Needs: Baby Items", visible: true },
              { fieldName: "Cleaning_Items_Text", label: "Needs: Cleaning Items", visible: true },
            ].filter((fi) => hasField(fi.fieldName)),
          }],
        };
        let combinedLayer = sourceLayer;
        try {
          const sourceFeatureSet = await sourceLayer.queryFeatures({
            where: "1=1",
            outFields: ["*"],
            returnGeometry: true,
            num: 2000,
          });
          const sourceFeatures = (sourceFeatureSet?.features || []).map((feature: any) => {
            const nextFeature = feature?.clone ? feature.clone() : feature;
            nextFeature.attributes = {
              ...nextFeature.attributes,
              [PIN_SELECTED_FIELD]: 0,
            };
            return nextFeature;
          });
          const maxObjectId = sourceFeatures.reduce((max: number, feature: any) => {
            const oid = Number(feature?.attributes?.ObjectId ?? feature?.attributes?.OBJECTID ?? 0);
            return Number.isFinite(oid) ? Math.max(max, oid) : max;
          }, 0);

          const regRes = await fetch("/api/registrations");
          const regData = await regRes.json();
          const regRows: RegistrationMapRow[] = Array.isArray(regData?.registrations) ? regData.registrations : [];
          const regGraphics = regRows
            .map((row, idx) => toRegistrationGraphic(GraphicModule, row, maxObjectId + idx + 1))
            .filter((g): g is any => g !== null)
            .map((graphic: any) => {
              graphic.attributes = {
                ...graphic.attributes,
                [PIN_SELECTED_FIELD]: 0,
              };
              return graphic;
            });

          const sourceFields = Array.isArray(sourceLayer.fields) ? [...sourceLayer.fields] : [];
          if (!sourceFields.some((field: any) => String(field?.name) === PIN_SELECTED_FIELD)) {
            sourceFields.push({
              name: PIN_SELECTED_FIELD,
              alias: "Pin Selected",
              type: "small-integer",
            });
          }

          combinedLayer = new FeatureLayer({
            title: "Non-Profit Locations",
            source: [...sourceFeatures, ...regGraphics],
            fields: sourceFields,
            objectIdField: sourceLayer.objectIdField || "ObjectId",
            geometryType: "point",
            spatialReference: sourceLayer.spatialReference,
            outFields: ["*"],
            popupEnabled: true,
            popupTemplate: sourceLayer.popupTemplate,
            renderer: buildPinRenderer(),
            featureReduction: clusterConfig,
          });
        } catch {
          // If cloning fails, keep map functional with hosted ArcGIS layer only.
        }

        sourceLayerRef.current = combinedLayer;
        layerQueryUrlRef.current = "";

        const map = new ArcGISMap({ basemap: "topo-vector", layers: [combinedLayer] });

        view = new MapView({
          container: mapContainerRef.current,
          map,
          popup: { dockEnabled: false, dockOptions: { breakpoint: false } },
        });

        mapViewRef.current = view;
        await view.when();

        // ── Service Area layer + click handler ───────────────────────────────
        const saLayer = new GraphicsLayer({ title: "Service Areas" });
        map.add(saLayer, 0); // Add below the nonprofit feature layer
        serviceAreaLayerRef.current = saLayer;
        serviceAreaModulesRef.current = {
          serviceArea: serviceAreaModule,
          ServiceAreaParams,
          FeatureSet: FeatureSetModule,
          Graphic: GraphicModule,
          GraphicsLayer,
        };

        // ── Routing layer + modules ──────────────────────────────────────────
        const routeLayer = new GraphicsLayer({ title: "Route" });
        map.add(routeLayer, 0); // Below nonprofit layer
        routeLayerRef.current = routeLayer;
        routeModulesRef.current = {
          route: routeModule,
          RouteParameters,
          networkService: networkServiceModule,
          FeatureSet: FeatureSetModule,
          Graphic: GraphicModule,
        };

        view.on("click", (event: any) => {
          // Route mode takes priority
          if (routeModeRef.current) {
            event.stopPropagation();
            solveAndDisplayRoute(event.mapPoint);
            return;
          }
          if (!serviceAreaClickHandleRef.current) return;
          // Only process if service area mode is active (checked via ref flag)
          event.stopPropagation();
          solveAndDisplayServiceArea(event.mapPoint);
        });

        try {
          view.ui.add(new LayerList({ view }), "top-left");
        } catch {
          // Ignore optional widget errors so core map/results still load.
        }

        // Search widget removed — app-level search bar handles filtering
        // and shows ALL matching orgs instead of navigating to just one.

        popupSelectedHandle = view.watch("popup.selectedFeature", (feature: any) => {
          const nextId = String(feature?.attributes?.ObjectId ?? feature?.attributes?.OBJECTID ?? "");
          setSelectedOrgId(nextId || null);
          const fromPopup = mapFeatureToResult(feature, 0);
          if (fromPopup) {
            setDetailOrg(fromPopup);
          }
          void markSelectedPin(feature);
        });

        try {
          const extentResult = await sourceLayer.queryExtent({ where: "1=1" });
          if (extentResult?.extent) {
            await view.goTo(extentResult.extent.expand(1.1), { animate: false });
          }
          const minScale = Number(sourceLayer.minScale || 0);
          if (minScale > 0 && Number(view.scale) > minScale) {
            await view.goTo({ scale: minScale * 0.95 }, { animate: false });
          }
        } catch {
          // Extent is optional; keep page functional if queryExtent fails.
        }

        await refreshResults();
      })
      .catch((err: any) => {
        const details = typeof err?.message === "string" ? ` (${err.message})` : "";
        setError(`Map unavailable${details}. Showing list results only.`);
        void refreshResults();
      });

    return () => {
      popupSelectedHandle?.remove();
      view?.destroy();
      mapViewRef.current = null;
      sourceLayerRef.current = null;
      serviceAreaLayerRef.current = null;
      serviceAreaModulesRef.current = null;
      routeLayerRef.current = null;
      routeModulesRef.current = null;
      selectedPinObjectIdRef.current = null;
      featureByIdRef.current.clear();
    };
  }, []);

  // Sync service area mode flag with the click handler ref
  useEffect(() => {
    serviceAreaClickHandleRef.current = serviceAreaMode;
    if (!serviceAreaMode) {
      clearServiceAreaGraphics();
      setServiceAreaError("");
    }
  }, [serviceAreaMode]);

  // Keep travel mode ref in sync so the click handler always reads the latest value
  useEffect(() => {
    serviceAreaTravelModeRef.current = serviceAreaTravelMode;
  }, [serviceAreaTravelMode]);

  // Keep routing refs in sync
  useEffect(() => {
    routeModeRef.current = routeMode;
  }, [routeMode]);

  useEffect(() => {
    routeDestinationRef.current = routeDestination;
  }, [routeDestination]);

  useEffect(() => {
    routeTravelModeRef.current = routeTravelMode;
  }, [routeTravelMode]);

  // Auto-apply filters when quick-filter buttons change
  useEffect(() => {
    if (sourceLayerRef.current) {
      void applyFilters();
    }
  }, [staffingFilter, urgentOnly]);

  return (
    <motion.div
      key="donor-map"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-full min-h-screen"
      style={{ fontFamily: "'Nunito', sans-serif", background: C.cream }}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>PinHelp</p>
          <h1 className="text-4xl font-extrabold leading-tight" style={{ color: C.navy }}>Donations Map</h1>
        </div>
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center border shadow-sm transition-colors hover:opacity-70"
          style={{ borderColor: `${C.navy}15`, background: "rgba(255,255,255,0.9)", color: C.navy }}
          aria-label="Exit"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 pb-3 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void applyFilters();
          }}
          className="flex items-center gap-2 bg-white rounded-2xl border shadow-sm px-4 py-2.5"
          style={{ borderColor: `${C.blue}25` }}
        >
          <Search size={17} style={{ color: `${C.navy}40` }} className="flex-shrink-0" />
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search by city, zip, org name, or items (e.g. diapers, laptops)..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:opacity-35"
            style={{ color: C.navy }}
          />
          <button
            type="submit"
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: C.blue, color: "#fff" }}
            aria-label="Search"
          >
            <CornerDownLeft size={15} />
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-2 items-center">
          <button
            type="button"
            onClick={() => {
              setUrgentOnly((prev) => !prev);
            }}
            className="rounded-xl border px-3 py-2 text-xs font-bold whitespace-nowrap"
            style={{
              borderColor: urgentOnly ? C.rose : `${C.navy}20`,
              color: urgentOnly ? C.rose : C.navy,
              background: urgentOnly ? `${C.rose}10` : "rgba(255,255,255,0.9)",
            }}
          >
            Urgent Only
          </button>

          <div className="rounded-xl border bg-white p-1 grid grid-cols-3 gap-1" style={{ borderColor: `${C.navy}12` }}>
            {([
              { value: "any", label: "Any" },
              { value: "needed", label: "Volunteers Needed" },
              { value: "not-needed", label: "Not Needed" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStaffingFilter(opt.value)}
                className="rounded-lg px-2 py-1.5 text-[11px] font-semibold border"
                style={{
                  borderColor: staffingFilter === opt.value ? C.rose : `${C.navy}16`,
                  color: staffingFilter === opt.value ? C.rose : `${C.navy}70`,
                  background: staffingFilter === opt.value ? `${C.rose}10` : "transparent",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className="rounded-xl border px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ borderColor: `${C.navy}20`, color: C.navy, background: "rgba(255,255,255,0.9)" }}
          >
            More Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex h-4 min-w-4 px-1 rounded-full items-center justify-center text-[10px] text-white" style={{ background: C.blue }}>
                {activeFilterCount}
              </span>
            )}
            <ChevronRight size={12} style={{ transform: showAdvancedFilters ? "rotate(90deg)" : "none" }} />
          </button>
        </div>

        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border bg-white p-3 space-y-3" style={{ borderColor: `${C.navy}12` }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={orgNameFilter}
                    onChange={(e) => setOrgNameFilter(e.target.value)}
                    placeholder="Organization name"
                    className="rounded-lg border bg-white px-3 py-2 text-xs outline-none"
                    style={{ borderColor: `${C.navy}15`, color: C.navy }}
                  />
                  <input
                    type="text"
                    value={zipFilter}
                    onChange={(e) => setZipFilter(e.target.value)}
                    placeholder="ZIP code"
                    className="rounded-lg border bg-white px-3 py-2 text-xs outline-none"
                    style={{ borderColor: `${C.navy}15`, color: C.navy }}
                  />
                  <input
                    type="text"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    placeholder="City"
                    className="rounded-lg border bg-white px-3 py-2 text-xs outline-none"
                    style={{ borderColor: `${C.navy}15`, color: C.navy }}
                  />
                  <input
                    type="text"
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    placeholder="Mission area"
                    className="rounded-lg border bg-white px-3 py-2 text-xs outline-none"
                    style={{ borderColor: `${C.navy}15`, color: C.navy }}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: `${C.navy}45` }}>Donations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {RESOURCE_FILTERS.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => toggleResourceFilter(item.key)}
                        className="rounded-full px-3 py-1.5 text-[11px] font-semibold border"
                        style={{
                          borderColor: selectedResourceFilters.has(item.key) ? C.blue : `${C.navy}20`,
                          color: selectedResourceFilters.has(item.key) ? C.blue : `${C.navy}70`,
                          background: selectedResourceFilters.has(item.key) ? `${C.blue}10` : "transparent",
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: `${C.navy}45` }}>Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SECTOR_FILTERS.map((tag) => (
                      <button
                        key={tag.value}
                        onClick={() => toggleSectorFilter(tag.value)}
                        className="rounded-full px-3 py-1.5 text-[11px] font-semibold border"
                        style={{
                          borderColor: selectedSectorFilters.has(tag.value) ? C.green : `${C.navy}20`,
                          color: selectedSectorFilters.has(tag.value) ? C.green : `${C.navy}70`,
                          background: selectedSectorFilters.has(tag.value) ? `${C.green}10` : "transparent",
                        }}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 pt-0.5">
          <button onClick={() => void applyFilters()} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: C.blue, color: "white" }}>
            Apply
          </button>
          <button onClick={() => void resetFilters()} className="rounded-lg px-3 py-2 text-xs font-bold border" style={{ borderColor: `${C.navy}20`, color: C.navy }}>
            Reset
          </button>
        </div>
      </div>

      {/* ── Map Container ── */}
      <div className="relative mx-4 mb-3 rounded-2xl overflow-hidden shadow-md border" style={{ height: 500, borderColor: `${C.blue}18` }}>
        <div ref={mapContainerRef} className="absolute inset-0" />

        <div className="absolute bottom-3 right-3 text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg z-10" style={{ background: C.navy }}>
          {isLoading ? "Loading..." : `${results.length} showing`}
        </div>
        {error ? (
          <div className="absolute bottom-3 left-3 z-10 rounded-lg px-3 py-2 text-xs text-white" style={{ background: C.rose }}>
            {error}
          </div>
        ) : null}

        {/* Hotspot Legend – shown at bottom of map when hotspot layer is active */}
        {hotspotLayerActive && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-xl px-4 py-2.5 shadow-lg border" style={{ background: "rgba(255,255,255,0.95)", borderColor: `${C.navy}15` }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5 text-center" style={{ color: `${C.navy}50` }}>Hotspot Legend</p>
            <div className="flex items-center gap-3">
              {[
                { color: "rgb(180,0,0)", label: "Hot (99%)" },
                { color: "rgb(240,60,60)", label: "Hot (95%)" },
                { color: "rgb(255,140,140)", label: "Hot (90%)" },
                { color: "rgb(245,235,220)", label: "Not Significant" },
                { color: "rgb(140,140,255)", label: "Cold (90%)" },
                { color: "rgb(60,60,240)", label: "Cold (95%)" },
                { color: "rgb(0,0,180)", label: "Cold (99%)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm" style={{ background: item.color, opacity: 0.7 }} />
                  <span className="text-[9px] font-medium whitespace-nowrap" style={{ color: `${C.navy}80` }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Route Mode Banner + Results ── */}
      {(routeMode || routeLoading || routeResult || routeError) && (
        <div className="mx-4 mb-3 rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: `${C.blue}30` }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: `${C.navy}10`, background: `${C.blue}08` }}>
            <div className="flex items-center gap-2">
              <MapPinIcon size={14} style={{ color: C.blue }} />
              <span className="text-xs font-bold" style={{ color: C.navy }}>
                {routeMode
                  ? "Click the map to set your starting point"
                  : routeLoading
                    ? "Calculating route..."
                    : `Route to ${routeDestination?.name || "organization"}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Drive / Walk toggle */}
              {(routeMode || routeResult) && (
                <div className="grid grid-cols-2 gap-0.5 rounded-md border p-0.5" style={{ borderColor: `${C.navy}12` }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRouteTravelMode("drive");
                      routeTravelModeRef.current = "drive";
                      if (routeOriginRef.current) {
                        setTimeout(() => solveAndDisplayRoute(routeOriginRef.current), 0);
                      }
                    }}
                    className="rounded px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: routeTravelMode === "drive" ? C.blue : "transparent",
                      color: routeTravelMode === "drive" ? "#fff" : C.navy,
                    }}
                  >
                    Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRouteTravelMode("walk");
                      routeTravelModeRef.current = "walk";
                      if (routeOriginRef.current) {
                        setTimeout(() => solveAndDisplayRoute(routeOriginRef.current), 0);
                      }
                    }}
                    className="rounded px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: routeTravelMode === "walk" ? C.green : "transparent",
                      color: routeTravelMode === "walk" ? "#fff" : C.navy,
                    }}
                  >
                    Walk
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setRouteMode(false);
                  routeModeRef.current = false;
                  setRouteDestination(null);
                  clearRoute();
                }}
                className="rounded-full w-6 h-6 border flex items-center justify-center"
                style={{ borderColor: `${C.navy}20`, color: `${C.navy}60` }}
                aria-label="Cancel route"
              >
                <X size={11} />
              </button>
            </div>
          </div>

          {/* Route Result */}
          {routeResult && (
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-4">
                <div className="rounded-lg px-3 py-1.5" style={{ background: `${C.blue}12` }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: `${C.navy}60` }}>Time</p>
                  <p className="text-sm font-extrabold" style={{ color: C.navy }}>{routeResult.minutes} min</p>
                </div>
                <div className="rounded-lg px-3 py-1.5" style={{ background: `${C.green}12` }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: `${C.navy}60` }}>Distance</p>
                  <p className="text-sm font-extrabold" style={{ color: C.navy }}>{routeResult.miles} mi</p>
                </div>
                <div className="rounded-lg px-3 py-1.5" style={{ background: `${C.rose}12` }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: `${C.navy}60` }}>Mode</p>
                  <p className="text-sm font-extrabold" style={{ color: C.navy }}>{routeTravelMode === "walk" ? "Walking" : "Driving"}</p>
                </div>
              </div>

              {routeResult.directions.length > 0 && (
                <details className="mt-2">
                  <summary className="text-[11px] font-bold cursor-pointer" style={{ color: C.blue }}>
                    Turn-by-turn directions ({routeResult.directions.length} steps)
                  </summary>
                  <ol className="mt-2 space-y-1 pl-4 list-decimal text-[11px]" style={{ color: `${C.navy}80` }}>
                    {routeResult.directions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          )}

          {/* Error */}
          {routeError && (
            <div className="px-4 py-2">
              <p className="text-xs" style={{ color: C.rose }}>{routeError}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Hotspot Analysis Panel ── */}
      <div className="mx-4 mb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setServiceAreaMode((prev) => !prev)}
            className="rounded-xl border px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-colors"
            style={{
              borderColor: serviceAreaMode ? C.blue : `${C.navy}20`,
              color: serviceAreaMode ? C.blue : C.navy,
              background: serviceAreaMode ? `${C.blue}08` : "rgba(255,255,255,0.9)",
            }}
            aria-pressed={serviceAreaMode}
            title="Click on the map to see drive-time areas"
          >
            <MapPinIcon size={14} />
            Service Area
            <ChevronRight size={12} style={{ transform: serviceAreaMode ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          <button
            type="button"
            onClick={() => setShowHotspotPanel((prev) => !prev)}
            className="rounded-xl border px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-colors"
            style={{
              borderColor: showHotspotPanel ? C.rose : `${C.navy}20`,
              color: showHotspotPanel ? C.rose : C.navy,
              background: showHotspotPanel ? `${C.rose}08` : "rgba(255,255,255,0.9)",
            }}
          >
            <TrendingUp size={14} />
            Hotspot Analysis
            <ChevronRight size={12} style={{ transform: showHotspotPanel ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        </div>

        {serviceAreaMode && (
          <div className="mt-2 rounded-xl border bg-white px-3 py-2 space-y-2" style={{ borderColor: `${C.navy}12` }}>
            <div className="grid grid-cols-2 gap-1 rounded-lg border p-0.5" style={{ borderColor: `${C.navy}12` }}>
              <button
                type="button"
                onClick={() => setServiceAreaTravelMode("drive")}
                className="rounded-md px-2 py-1 text-[10px] font-bold"
                style={{
                  background: serviceAreaTravelMode === "drive" ? C.blue : "transparent",
                  color: serviceAreaTravelMode === "drive" ? "#fff" : C.navy,
                }}
              >
                Drive
              </button>
              <button
                type="button"
                onClick={() => setServiceAreaTravelMode("walk")}
                className="rounded-md px-2 py-1 text-[10px] font-bold"
                style={{
                  background: serviceAreaTravelMode === "walk" ? C.green : "transparent",
                  color: serviceAreaTravelMode === "walk" ? "#fff" : C.navy,
                }}
              >
                Walk
              </button>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.navy }}>
              {serviceAreaLoading ? "Calculating..." : "Click map to analyze"}
            </p>
            {SERVICE_AREA_BREAKS.map((mins, i) => (
              <div key={mins} className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm border"
                  style={{ background: SERVICE_AREA_COLORS[i], borderColor: SERVICE_AREA_COLORS[i]?.replace(/[\d.]+\)$/, "0.8)") }}
                />
                <span className="text-[11px] font-semibold" style={{ color: C.navy }}>{mins} min {serviceAreaTravelMode === "walk" ? "walk" : "drive"}</span>
              </div>
            ))}
            {serviceAreaError && (
              <p className="text-[10px] mt-1" style={{ color: C.rose }}>{serviceAreaError}</p>
            )}
          </div>
        )}

        <AnimatePresence>
          {showHotspotPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-2xl border bg-white p-4 space-y-4" style={{ borderColor: `${C.navy}12` }}>
                {/* County Search */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: `${C.navy}45` }}>County</p>
                  {hotspotSelectedCounty ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                        style={{ background: `${C.blue}12`, color: C.blue }}
                      >
                        {hotspotSelectedCounty.county}, {hotspotSelectedCounty.stAbbr}
                        <button
                          type="button"
                          onClick={clearHotspotCounty}
                          className="hover:opacity-60"
                          aria-label="Clear county"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={hotspotCountySearch}
                        onChange={(e) => handleHotspotCountySearch(e.target.value)}
                        placeholder="Search county (e.g. San Bernardino)"
                        className="w-full rounded-lg border bg-white px-3 py-2 text-xs outline-none"
                        style={{ borderColor: `${C.navy}15`, color: C.navy }}
                      />
                      {hotspotCountySuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border bg-white shadow-lg max-h-48 overflow-auto" style={{ borderColor: `${C.navy}15` }}>
                          {hotspotCountySuggestions.map((item) => (
                            <button
                              key={`${item.county}-${item.stAbbr}`}
                              type="button"
                              onClick={() => selectHotspotCounty(item)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                              style={{ color: C.navy }}
                            >
                              {item.county}, {item.stAbbr}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Demographic Fields */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: `${C.navy}45` }}>
                    Demographic Columns {hotspotSelectedFields.size > 0 && `(${hotspotSelectedFields.size} selected)`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {HOTSPOT_FIELDS.map((field) => (
                      <label
                        key={field.key}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs cursor-pointer border transition-colors"
                        style={{
                          borderColor: hotspotSelectedFields.has(field.key) ? C.blue : `${C.navy}10`,
                          background: hotspotSelectedFields.has(field.key) ? `${C.blue}08` : "transparent",
                          color: C.navy,
                          opacity: hotspotSelectedCounty ? 1 : 0.4,
                          pointerEvents: hotspotSelectedCounty ? "auto" : "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={hotspotSelectedFields.has(field.key)}
                          onChange={() => toggleHotspotField(field.key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={!hotspotSelectedCounty}
                        />
                        <span className="font-medium">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void runHotspotAnalysis()}
                    disabled={hotspotLoading || !hotspotSelectedCounty || hotspotSelectedFields.size === 0}
                    className="rounded-lg px-4 py-2 text-xs font-bold transition-opacity disabled:opacity-40"
                    style={{ background: C.blue, color: "white" }}
                  >
                    {hotspotLoading ? "Running..." : "Run Analysis"}
                  </button>
                  <button
                    type="button"
                    onClick={clearHotspotLayer}
                    className="rounded-lg px-3 py-2 text-xs font-bold border"
                    style={{ borderColor: `${C.navy}20`, color: C.navy }}
                  >
                    Clear
                  </button>
                  {hotspotStatus && (
                    <span className="text-[11px] font-medium" style={{ color: `${C.navy}60` }}>{hotspotStatus}</span>
                  )}
                </div>

                {/* Error */}
                {hotspotError && (
                  <div className="rounded-lg px-3 py-2 text-xs text-white" style={{ background: C.rose }}>
                    {hotspotError}
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedOrg ? (
          <motion.section
            key={selectedOrg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="mx-4 mb-3 rounded-2xl border bg-white shadow-sm"
            style={{ borderColor: `${C.navy}12` }}
          >
            <div className="flex items-start justify-between gap-2 px-4 py-3 border-b" style={{ borderColor: `${C.navy}10` }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>Organization Details</p>
                <h3 className="text-base font-extrabold" style={{ color: C.navy }}>{selectedOrg.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const feature = selectedOrg.feature;
                    const lat = feature?.geometry?.latitude ?? feature?.attributes?.Latitude;
                    const lon = feature?.geometry?.longitude ?? feature?.attributes?.Longitude;
                    if (lat && lon) {
                      setRouteDestination({ lat: Number(lat), lon: Number(lon), name: selectedOrg.name });
                      setRouteMode(true);
                      clearRoute();
                    }
                  }}
                  className="rounded-lg border px-3 py-1.5 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  style={{
                    borderColor: routeMode && routeDestination?.name === selectedOrg.name ? C.blue : `${C.navy}20`,
                    color: routeMode && routeDestination?.name === selectedOrg.name ? "#fff" : C.blue,
                    background: routeMode && routeDestination?.name === selectedOrg.name ? C.blue : "transparent",
                  }}
                >
                  <MapPinIcon size={11} />
                  Route to here
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrgId(null);
                    setDetailOrg(null);
                  }}
                  className="rounded-full w-7 h-7 border flex items-center justify-center"
                  style={{ borderColor: `${C.navy}20`, color: `${C.navy}70` }}
                  aria-label="Close details"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: `${C.navy}45` }}>Key Information</p>
                <div className="space-y-1.5">
                  {keyInfoRows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[120px_1fr] gap-2 text-xs">
                      <span className="font-bold" style={{ color: `${C.navy}55` }}>{row.label}</span>
                      <span style={{ color: `${C.navy}80` }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: `${C.navy}45` }}>Donation Needs</p>
                {donationNeedDetails.length > 0 ? (
                  <div className="space-y-2">
                    {donationNeedDetails.map((need) => (
                      <div key={need.label} className="rounded-lg border px-2.5 py-2" style={{ borderColor: `${C.navy}12` }}>
                        <p className="text-xs font-bold" style={{ color: C.navy }}>{need.label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: `${C.navy}70` }}>
                          {need.items.length > 0 ? need.items.join(", ") : "Listed as needed"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: `${C.navy}60` }}>No donation needs were provided in this record.</p>
                )}
              </div>
            </div>

            <div className="px-4 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: `${C.navy}45` }}>All Available Data</p>
              <div className="max-h-56 overflow-auto rounded-lg border" style={{ borderColor: `${C.navy}12` }}>
                <div className="divide-y" style={{ borderColor: `${C.navy}10` }}>
                  {allAttributeRows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[180px_1fr] gap-2 px-3 py-2 text-xs">
                      <span className="font-semibold" style={{ color: `${C.navy}55` }}>{row.label}</span>
                      <span style={{ color: `${C.navy}80` }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <section className="pb-10">
        <div className="flex items-center justify-between px-5 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: C.rose }}>Results</p>
            <h2 className="text-lg font-extrabold" style={{ color: C.navy }}>{results.length} organization{results.length !== 1 ? "s" : ""}</h2>
          </div>
          {activeFilterCount > 0 ? (
            <button onClick={() => void resetFilters()} className="text-xs font-bold transition-opacity hover:opacity-60" style={{ color: `${C.navy}45` }}>Clear filters</button>
          ) : null}
        </div>

        {results.length === 0 ? (
          <div className="mx-4 rounded-2xl border border-dashed px-4 py-10 text-sm text-center" style={{ borderColor: `${C.navy}18`, color: `${C.navy}50`, background: C.cream }}>
            No matches. Try adjusting search or filters.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4 px-4" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            {results.map((org) => (
              <motion.article
                key={org.id}
                animate={selectedOrgId === org.id ? { scale: 1.025, y: -5 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 rounded-2xl border p-4 shadow-sm cursor-pointer flex flex-col gap-3"
                style={{
                  width: 272,
                  borderColor: selectedOrgId === org.id ? C.rose : `${C.navy}10`,
                  background: selectedOrgId === org.id ? `${C.rose}05` : "#fffdf9",
                  boxShadow: selectedOrgId === org.id ? `0 8px 28px ${C.rose}22` : "0 2px 10px rgba(26,26,46,0.07)",
                }}
                onClick={() => void zoomToResult(org)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold leading-snug" style={{ color: C.navy }}>{org.name}</h3>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: `${C.navy}50` }}>{org.address}</p>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white flex-shrink-0" style={{ background: C.navy }}>
                    {org.city || "Area"}
                  </span>
                </div>

                <p className="text-[11px] leading-relaxed" style={{ color: `${C.navy}60` }}>
                  {org.missionArea || "Mission area not provided"}
                </p>

                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {(org.categories.length > 0 ? org.categories : ["Needs in full details"]).slice(0, 3).map((item) => (
                    <span key={item} className="text-[10px] rounded-full px-2 py-0.5 font-semibold" style={{ background: `${C.green}15`, color: C.green }}>
                      {item}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 mt-auto border-t" style={{ borderColor: `${C.navy}08` }}>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: org.volunteersNeeded ? `${C.rose}15` : `${C.green}15`, color: org.volunteersNeeded ? C.rose : C.green }}>
                    {org.volunteersNeeded ? "Volunteers Needed" : "Donations Accepted"}
                  </span>
                  <button type="button" className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border" style={{ borderColor: `${C.navy}15`, color: C.navy }}>
                    <MapPinIcon size={11} /> Show on map
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

// ── Volunteer data ─────────────────────────────────────────────────────────────
const VOLUNTEER_NOTIFICATIONS = [
  { id: "v1", name: "Priya Sharma",   action: "signed up to volunteer", org: "Riverbend Community Pantry",    time: "2 min ago",  read: false },
  { id: "v2", name: "Marcus Webb",    action: "signed up to volunteer", org: "Horizon Youth Learning Hub",    time: "14 min ago", read: false },
  { id: "v3", name: "Lena Okafor",    action: "signed up to volunteer", org: "Sunrise Family Shelter",        time: "1 hr ago",   read: false },
  { id: "v4", name: "Diego Reyes",    action: "signed up to volunteer", org: "Northside Health Access",       time: "3 hrs ago",  read: true },
  { id: "v5", name: "Samantha Yu",    action: "signed up to volunteer", org: "Oak Glen Community Closet",     time: "Yesterday",  read: true },
];

const STATS = [
  { label: "Volunteers This Week", value: "24",    delta: "+6 from last week",   icon: Users,      color: C.rose  },
  { label: "Broadcasts Sent",      value: "11",    delta: "+3 from last week",   icon: Heart,      color: C.green },
  { label: "People Reached",       value: "2,310", delta: "+180 from last week", icon: TrendingUp, color: C.blue  },
];

// ── OrgDashboard ───────────────────────────────────────────────────────────────
// ── UpdateNeedsForm ─────────────────────────────────────────────────────────
function UpdateNeedsForm({ onBack }: { onBack: () => void }) {
  const [needs, setNeeds] = useState("");
  const [volunteersNeeded, setVolunteersNeeded] = useState(false);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [urgencyScore, setUrgencyScore] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const needsArray = needs.split(",").map((n) => n.trim()).filter(Boolean);
    if (needsArray.length === 0) {
      setError("Please enter at least one need (comma-separated).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/nonprofit/needs", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer demo-token" },
        body: JSON.stringify({ needs: needsArray, volunteersNeeded, priority, urgencyScore }),
      });
      if (res.ok) {
        setMessage("Needs updated successfully!");
        setNeeds("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to update needs.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div key="needs-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="px-4 py-2 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: `${C.navy}20`, color: C.navy }}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>Manage</p>
          <h2 className="text-xl font-extrabold" style={{ color: C.navy }}>Update Needs List</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white/90 shadow-sm border p-4 space-y-4" style={{ borderColor: `${C.navy}08` }}>
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>Needs (comma-separated)</label>
          <textarea
            value={needs}
            onChange={(e) => setNeeds(e.target.value)}
            placeholder="e.g. Canned food, Winter coats, Diapers"
            className="w-full mt-1 rounded-xl border bg-white px-4 py-3 text-sm outline-none resize-none"
            style={{ borderColor: `${C.navy}15`, color: C.navy, minHeight: 80 }}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold" style={{ color: C.navy }}>Volunteers Needed</label>
          <button type="button" onClick={() => setVolunteersNeeded((v) => !v)}
            className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors"
            style={{ background: volunteersNeeded ? C.blue : `${C.navy}15` }}>
            <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: volunteersNeeded ? "translateX(20px)" : "translateX(0)" }} />
          </button>
        </div>

        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>Priority</label>
          <div className="flex gap-2 mt-1">
            {(["low", "medium", "high"] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className="rounded-lg px-4 py-2 text-xs font-bold border capitalize"
                style={{
                  borderColor: priority === p ? C.rose : `${C.navy}15`,
                  color: priority === p ? C.rose : C.navy,
                  background: priority === p ? `${C.rose}10` : "transparent",
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>Urgency Score: {urgencyScore}</label>
          <input type="range" min={1} max={100} value={urgencyScore} onChange={(e) => setUrgencyScore(Number(e.target.value))}
            className="w-full mt-1" />
        </div>

        {error && <p className="text-xs font-semibold" style={{ color: C.rose }}>{error}</p>}
        {message && <p className="text-xs font-semibold" style={{ color: C.green }}>{message}</p>}

        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          style={{ background: C.blue }}>
          {submitting ? "Saving..." : "Update Needs"}
        </button>
      </form>
    </motion.div>
  );
}

// ── VolunteerShiftForm ──────────────────────────────────────────────────────────
function VolunteerShiftForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({
    organizationName: "",
    roleTitle: "",
    shiftDate: "",
    startTime: "",
    endTime: "",
    volunteersNeeded: 1,
    location: "",
    notes: "",
    contactName: "",
    contactEmail: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const update = (field: string, value: string | number) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.organizationName || !form.roleTitle || !form.shiftDate || !form.startTime || !form.endTime || !form.location) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/volunteer-shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, volunteersNeeded: Number(form.volunteersNeeded) }),
      });
      if (res.ok) {
        setMessage("Volunteer shift created!");
        setForm({ organizationName: "", roleTitle: "", shiftDate: "", startTime: "", endTime: "", volunteersNeeded: 1, location: "", notes: "", contactName: "", contactEmail: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to create shift.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div key="shift-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="px-4 py-2 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: `${C.navy}20`, color: C.navy }}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>Schedule</p>
          <h2 className="text-xl font-extrabold" style={{ color: C.navy }}>New Volunteer Shift</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white/90 shadow-sm border p-4 space-y-3" style={{ borderColor: `${C.navy}08` }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Organization Name *</label>
            <input type="text" value={form.organizationName} onChange={(e) => update("organizationName", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Role Title *</label>
            <input type="text" value={form.roleTitle} onChange={(e) => update("roleTitle", e.target.value)} placeholder="e.g. Food Sorter"
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Shift Date *</label>
            <input type="date" value={form.shiftDate} onChange={(e) => update("shiftDate", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold" style={{ color: C.navy }}>Start *</label>
              <input type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)}
                className="w-full mt-1 rounded-xl border bg-white px-3 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
            </div>
            <div>
              <label className="text-xs font-bold" style={{ color: C.navy }}>End *</label>
              <input type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)}
                className="w-full mt-1 rounded-xl border bg-white px-3 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Volunteers Needed *</label>
            <input type="number" min={1} max={500} value={form.volunteersNeeded} onChange={(e) => update("volunteersNeeded", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Location *</label>
            <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="e.g. Main warehouse"
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Contact Name</label>
            <input type="text" value={form.contactName} onChange={(e) => update("contactName", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>Notes</label>
          <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Any additional details..."
            className="w-full mt-1 rounded-xl border bg-white px-4 py-3 text-sm outline-none resize-none" style={{ borderColor: `${C.navy}15`, color: C.navy, minHeight: 60 }} />
        </div>

        {error && <p className="text-xs font-semibold" style={{ color: C.rose }}>{error}</p>}
        {message && <p className="text-xs font-semibold" style={{ color: C.green }}>{message}</p>}

        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          style={{ background: C.rose }}>
          {submitting ? "Creating..." : "Create Shift"}
        </button>
      </form>
    </motion.div>
  );
}

// ── BroadcastForm ───────────────────────────────────────────────────────────────
function BroadcastForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({
    senderOrganization: "",
    recipients: "",
    title: "",
    category: "General",
    urgency: "Normal" as "Low" | "Normal" | "High" | "Critical",
    location: "",
    startDate: "",
    endDate: "",
    message: "",
    contactName: "",
    contactEmail: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [error, setError] = useState("");

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResultMessage("");

    const recipientsList = form.recipients.split(",").map((r) => r.trim()).filter(Boolean);
    if (!form.senderOrganization || recipientsList.length === 0 || !form.title || !form.message) {
      setError("Please fill in sender, at least one recipient, title, and message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, recipients: recipientsList }),
      });
      if (res.ok) {
        const data = await res.json();
        setResultMessage(`Broadcast sent to ${data.createdCount} organization(s)!`);
        setForm({ senderOrganization: "", recipients: "", title: "", category: "General", urgency: "Normal", location: "", startDate: "", endDate: "", message: "", contactName: "", contactEmail: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to send broadcast.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div key="broadcast-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="px-4 py-2 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: `${C.navy}20`, color: C.navy }}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>Communicate</p>
          <h2 className="text-xl font-extrabold" style={{ color: C.navy }}>Broadcast to Nearby Orgs</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white/90 shadow-sm border p-4 space-y-3" style={{ borderColor: `${C.navy}08` }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Your Organization *</label>
            <input type="text" value={form.senderOrganization} onChange={(e) => update("senderOrganization", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Recipients (comma-separated) *</label>
            <input type="text" value={form.recipients} onChange={(e) => update("recipients", e.target.value)} placeholder="e.g. Org A, Org B"
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Title *</label>
            <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Brief title for your broadcast"
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Category</label>
            <input type="text" value={form.category} onChange={(e) => update("category", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Urgency</label>
            <div className="flex gap-1.5 mt-1">
              {(["Low", "Normal", "High", "Critical"] as const).map((u) => (
                <button key={u} type="button" onClick={() => update("urgency", u)}
                  className="rounded-lg px-3 py-2 text-[11px] font-bold border"
                  style={{
                    borderColor: form.urgency === u ? (u === "Critical" || u === "High" ? C.rose : C.blue) : `${C.navy}15`,
                    color: form.urgency === u ? (u === "Critical" || u === "High" ? C.rose : C.blue) : C.navy,
                    background: form.urgency === u ? (u === "Critical" || u === "High" ? `${C.rose}10` : `${C.blue}10`) : "transparent",
                  }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Location</label>
            <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>End Date</label>
            <input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Contact Name</label>
            <input type="text" value={form.contactName} onChange={(e) => update("contactName", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)}
              className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>Message *</label>
          <textarea value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Describe what you need help with..."
            className="w-full mt-1 rounded-xl border bg-white px-4 py-3 text-sm outline-none resize-none" style={{ borderColor: `${C.navy}15`, color: C.navy, minHeight: 90 }} />
        </div>

        {error && <p className="text-xs font-semibold" style={{ color: C.rose }}>{error}</p>}
        {resultMessage && <p className="text-xs font-semibold" style={{ color: C.green }}>{resultMessage}</p>}

        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          style={{ background: C.blue }}>
          {submitting ? "Sending..." : "Send Broadcast"}
        </button>
      </form>
    </motion.div>
  );
}

type RegistrationNeedsKey =
  | "food"
  | "clothes"
  | "shelter"
  | "bedding"
  | "toiletries"
  | "furniture"
  | "medicalSupplies"
  | "electronics"
  | "educationMaterials"
  | "babyItems"
  | "cleaningItems";

type RegistrationRecord = {
  id: string;
  organizationName: string;
  address: string;
  city: string;
  stateAbbreviation: string;
  zip: string;
  industryDescription: string;
  employeeCount: string;
  esriCategoryDescription: string;
  missionArea: string;
  mainContact: string;
  contactEmail: string;
  websiteLink: string;
  workingHours: string;
  matchedAddress: string;
  needVolunteers: boolean | string;
  foodYN: string;
  foodText: string;
  clothesYN: string;
  clothesText: string;
  shelterYN: string;
  shelterText: string;
  beddingYN: string;
  beddingText: string;
  toiletriesYN: string;
  toiletriesText: string;
  furnitureYN: string;
  furnitureText: string;
  medicalSuppliesYN: string;
  medicalSuppliesText: string;
  electronicsYN: string;
  electronicsText: string;
  educationMaterialsYN: string;
  educationMaterialsText: string;
  babyItemsYN: string;
  babyItemsText: string;
  cleaningItemsYN: string;
  cleaningItemsText: string;
  latitude?: number;
  longitude?: number;
  description: string;
};

type RegistrationFormState = {
  organizationName: string;
  address: string;
  city: string;
  stateAbbreviation: string;
  zip: string;
  industryDescription: string;
  employeeCount: string;
  esriCategoryDescription: string;
  missionArea: string;
  mainContact: string;
  contactEmail: string;
  websiteLink: string;
  workingHours: string;
  matchedAddress: string;
  latitude: string;
  longitude: string;
  description: string;
  needVolunteers: boolean;
  needs: Record<RegistrationNeedsKey, { needed: boolean; text: string }>;
};

const REGISTRATION_NEEDS: Array<{ key: RegistrationNeedsKey; label: string; textLabel: string }> = [
  { key: "food", label: "Food", textLabel: "Food items" },
  { key: "clothes", label: "Clothes", textLabel: "Clothes details" },
  { key: "shelter", label: "Shelter", textLabel: "Shelter details" },
  { key: "bedding", label: "Bedding", textLabel: "Bedding details" },
  { key: "toiletries", label: "Toiletries", textLabel: "Toiletries details" },
  { key: "furniture", label: "Furniture", textLabel: "Furniture details" },
  { key: "medicalSupplies", label: "Medical Supplies", textLabel: "Medical supply details" },
  { key: "electronics", label: "Electronics", textLabel: "Electronics details" },
  { key: "educationMaterials", label: "Education Materials", textLabel: "Education materials details" },
  { key: "babyItems", label: "Baby Items", textLabel: "Baby item details" },
  { key: "cleaningItems", label: "Cleaning Items", textLabel: "Cleaning item details" },
];

const blankRegistrationForm = (defaultOrganizationName = ""): RegistrationFormState => ({
  organizationName: defaultOrganizationName,
  address: "",
  city: "",
  stateAbbreviation: "CA",
  zip: "",
  industryDescription: "",
  employeeCount: "",
  esriCategoryDescription: "",
  missionArea: "General Mission-Driven Nonprofit",
  mainContact: "",
  contactEmail: "",
  websiteLink: "",
  workingHours: "",
  matchedAddress: "",
  latitude: "",
  longitude: "",
  description: "",
  needVolunteers: false,
  needs: {
    food: { needed: false, text: "" },
    clothes: { needed: false, text: "" },
    shelter: { needed: false, text: "" },
    bedding: { needed: false, text: "" },
    toiletries: { needed: false, text: "" },
    furniture: { needed: false, text: "" },
    medicalSupplies: { needed: false, text: "" },
    electronics: { needed: false, text: "" },
    educationMaterials: { needed: false, text: "" },
    babyItems: { needed: false, text: "" },
    cleaningItems: { needed: false, text: "" },
  },
});

function OrganizationProfileForm({ onBack, defaultOrganizationName }: { onBack: () => void; defaultOrganizationName: string }) {
  const [existingRegistrations, setExistingRegistrations] = useState<RegistrationRecord[]>([]);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState("");
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [form, setForm] = useState<RegistrationFormState>(blankRegistrationForm(defaultOrganizationName));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const toBool = (value: boolean | string | undefined) => {
    const text = String(value ?? "").trim().toLowerCase();
    return value === true || text === "yes" || text === "true" || text === "1" || text === "y";
  };

  const loadRecord = (record: RegistrationRecord) => {
    setForm({
      organizationName: record.organizationName || "",
      address: record.address || "",
      city: record.city || "",
      stateAbbreviation: record.stateAbbreviation || "",
      zip: record.zip || "",
      industryDescription: record.industryDescription || "",
      employeeCount: String(record.employeeCount || ""),
      esriCategoryDescription: record.esriCategoryDescription || "",
      missionArea: record.missionArea || "",
      mainContact: record.mainContact || "",
      contactEmail: record.contactEmail || "",
      websiteLink: record.websiteLink || "",
      workingHours: record.workingHours || "",
      matchedAddress: record.matchedAddress || "",
      latitude: Number.isFinite(Number(record.latitude)) ? String(record.latitude) : "",
      longitude: Number.isFinite(Number(record.longitude)) ? String(record.longitude) : "",
      description: record.description || "",
      needVolunteers: toBool(record.needVolunteers),
      needs: {
        food: { needed: toBool(record.foodYN), text: record.foodText || "" },
        clothes: { needed: toBool(record.clothesYN), text: record.clothesText || "" },
        shelter: { needed: toBool(record.shelterYN), text: record.shelterText || "" },
        bedding: { needed: toBool(record.beddingYN), text: record.beddingText || "" },
        toiletries: { needed: toBool(record.toiletriesYN), text: record.toiletriesText || "" },
        furniture: { needed: toBool(record.furnitureYN), text: record.furnitureText || "" },
        medicalSupplies: { needed: toBool(record.medicalSuppliesYN), text: record.medicalSuppliesText || "" },
        electronics: { needed: toBool(record.electronicsYN), text: record.electronicsText || "" },
        educationMaterials: { needed: toBool(record.educationMaterialsYN), text: record.educationMaterialsText || "" },
        babyItems: { needed: toBool(record.babyItemsYN), text: record.babyItemsText || "" },
        cleaningItems: { needed: toBool(record.cleaningItemsYN), text: record.cleaningItemsText || "" },
      },
    });
  };

  useEffect(() => {
    const loadRegistrations = async () => {
      setLoadingRegistrations(true);
      try {
        const res = await fetch("/api/registrations");
        const data = await res.json();
        const rows: RegistrationRecord[] = Array.isArray(data?.registrations) ? data.registrations : [];
        setExistingRegistrations(rows);

        const defaultName = defaultOrganizationName.trim().toLowerCase();
        if (defaultName) {
          const matched = rows.find((row) => row.organizationName?.trim().toLowerCase() === defaultName);
          if (matched) {
            setSelectedRegistrationId(matched.id);
            loadRecord(matched);
          }
        }
      } catch {
        setError("Unable to load existing registrations.");
      } finally {
        setLoadingRegistrations(false);
      }
    };

    void loadRegistrations();
  }, [defaultOrganizationName]);

  const updateField = (field: keyof RegistrationFormState, value: string | boolean | RegistrationFormState["needs"]) => {
    setForm((prev) => ({ ...prev, [field]: value } as RegistrationFormState));
  };

  const updateNeed = (key: RegistrationNeedsKey, patch: Partial<{ needed: boolean; text: string }>) => {
    setForm((prev) => ({
      ...prev,
      needs: {
        ...prev.needs,
        [key]: {
          ...prev.needs[key],
          ...patch,
        },
      },
    }));
  };

  const resetToNew = () => {
    setSelectedRegistrationId("");
    setMessage("");
    setError("");
    setForm(blankRegistrationForm(defaultOrganizationName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.organizationName.trim() || !form.address.trim() || !form.city.trim() || !form.zip.trim() || !form.missionArea.trim()) {
      setError("Please fill in organization name, address, city, ZIP, and mission area.");
      return;
    }

    const payload = {
      organizationName: form.organizationName.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      stateAbbreviation: form.stateAbbreviation.trim(),
      zip: form.zip.trim(),
      industryDescription: form.industryDescription.trim(),
      employeeCount: form.employeeCount.trim(),
      esriCategoryDescription: form.esriCategoryDescription.trim(),
      missionArea: form.missionArea.trim(),
      mainContact: form.mainContact.trim(),
      contactEmail: form.contactEmail.trim(),
      websiteLink: form.websiteLink.trim(),
      workingHours: form.workingHours.trim(),
      matchedAddress: form.matchedAddress.trim(),
      latitude: form.latitude.trim() ? Number(form.latitude) : undefined,
      longitude: form.longitude.trim() ? Number(form.longitude) : undefined,
      description: form.description.trim(),
      needVolunteers: form.needVolunteers,
      foodYN: form.needs.food.needed,
      foodText: form.needs.food.text.trim(),
      clothesYN: form.needs.clothes.needed,
      clothesText: form.needs.clothes.text.trim(),
      shelterYN: form.needs.shelter.needed,
      shelterText: form.needs.shelter.text.trim(),
      beddingYN: form.needs.bedding.needed,
      beddingText: form.needs.bedding.text.trim(),
      toiletriesYN: form.needs.toiletries.needed,
      toiletriesText: form.needs.toiletries.text.trim(),
      furnitureYN: form.needs.furniture.needed,
      furnitureText: form.needs.furniture.text.trim(),
      medicalSuppliesYN: form.needs.medicalSupplies.needed,
      medicalSuppliesText: form.needs.medicalSupplies.text.trim(),
      electronicsYN: form.needs.electronics.needed,
      electronicsText: form.needs.electronics.text.trim(),
      educationMaterialsYN: form.needs.educationMaterials.needed,
      educationMaterialsText: form.needs.educationMaterials.text.trim(),
      babyItemsYN: form.needs.babyItems.needed,
      babyItemsText: form.needs.babyItems.text.trim(),
      cleaningItemsYN: form.needs.cleaningItems.needed,
      cleaningItemsText: form.needs.cleaningItems.text.trim(),
    };

    setSubmitting(true);
    try {
      const isUpdate = Boolean(selectedRegistrationId);
      const res = await fetch(isUpdate ? `/api/registrations/${selectedRegistrationId}` : "/api/registrations", {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Unable to save registration.");
        return;
      }

      const saved = data.registration as RegistrationRecord;
      if (saved?.id) {
        setSelectedRegistrationId(saved.id);
        setExistingRegistrations((prev) => {
          const idx = prev.findIndex((row) => row.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
      }
      setMessage(isUpdate ? "Organization details updated successfully." : "Organization registered successfully.");
    } catch {
      setError("Network error while saving registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div key="org-profile-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="px-4 py-2 pb-28 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: `${C.navy}20`, color: C.navy }}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>Organization</p>
          <h2 className="text-xl font-extrabold" style={{ color: C.navy }}>Register / Update Profile</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white/90 shadow-sm border p-4 space-y-4" style={{ borderColor: `${C.navy}08` }}>
        <div className="rounded-xl border p-3" style={{ borderColor: `${C.navy}12`, background: `${C.blue}08` }}>
          <label className="text-xs font-bold" style={{ color: C.navy }}>Load Existing Organization</label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <select
              value={selectedRegistrationId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedRegistrationId(value);
                const found = existingRegistrations.find((row) => row.id === value);
                if (found) {
                  loadRecord(found);
                }
              }}
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: `${C.navy}15`, color: C.navy }}
              disabled={loadingRegistrations}
            >
              <option value="">Select existing registration</option>
              {existingRegistrations.map((row) => (
                <option key={row.id} value={row.id}>{row.organizationName || row.id}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetToNew}
              className="rounded-xl px-3 py-2.5 text-xs font-bold border"
              style={{ borderColor: `${C.navy}20`, color: C.navy, background: "white" }}
            >
              Start New
            </button>
          </div>
          <p className="text-[11px] mt-2" style={{ color: `${C.navy}60` }}>
            Select a record to edit, or start a new registration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Organization Name *</label>
            <input value={form.organizationName} onChange={(e) => updateField("organizationName", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Main Contact</label>
            <input value={form.mainContact} onChange={(e) => updateField("mainContact", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Address *</label>
            <input value={form.address} onChange={(e) => updateField("address", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Matched Address</label>
            <input value={form.matchedAddress} onChange={(e) => updateField("matchedAddress", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>City *</label>
            <input value={form.city} onChange={(e) => updateField("city", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold" style={{ color: C.navy }}>State</label>
              <input value={form.stateAbbreviation} onChange={(e) => updateField("stateAbbreviation", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
            </div>
            <div>
              <label className="text-xs font-bold" style={{ color: C.navy }}>ZIP *</label>
              <input value={form.zip} onChange={(e) => updateField("zip", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Website</label>
            <input value={form.websiteLink} onChange={(e) => updateField("websiteLink", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Mission Area *</label>
            <input value={form.missionArea} onChange={(e) => updateField("missionArea", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Working Hours</label>
            <input value={form.workingHours} onChange={(e) => updateField("workingHours", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Industry Description</label>
            <input value={form.industryDescription} onChange={(e) => updateField("industryDescription", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Esri Category Description</label>
            <input value={form.esriCategoryDescription} onChange={(e) => updateField("esriCategoryDescription", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Employee Count</label>
            <input value={form.employeeCount} onChange={(e) => updateField("employeeCount", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Latitude</label>
            <input value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} placeholder="e.g. 34.0558" className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>Longitude</label>
            <input value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} placeholder="e.g. -117.1825" className="w-full mt-1 rounded-xl border bg-white px-4 py-2.5 text-sm outline-none" style={{ borderColor: `${C.navy}15`, color: C.navy }} />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>Organization Description</label>
          <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="w-full mt-1 rounded-xl border bg-white px-4 py-3 text-sm outline-none resize-none" style={{ borderColor: `${C.navy}15`, color: C.navy, minHeight: 85 }} />
        </div>

        <div className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: `${C.navy}12` }}>
          <div>
            <p className="text-xs font-bold" style={{ color: C.navy }}>Need Volunteers</p>
            <p className="text-[11px]" style={{ color: `${C.navy}55` }}>Toggle if your organization is currently requesting volunteer help.</p>
          </div>
          <button type="button" onClick={() => updateField("needVolunteers", !form.needVolunteers)} className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors" style={{ background: form.needVolunteers ? C.blue : `${C.navy}15` }}>
            <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: form.needVolunteers ? "translateX(20px)" : "translateX(0)" }} />
          </button>
        </div>

        <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: `${C.navy}12` }}>
          <p className="text-xs font-bold" style={{ color: C.navy }}>Donation Needs</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {REGISTRATION_NEEDS.map((item) => (
              <div key={item.key} className="rounded-lg border p-3" style={{ borderColor: `${C.navy}10` }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold" style={{ color: C.navy }}>{item.label}</p>
                  <button
                    type="button"
                    onClick={() => updateNeed(item.key, { needed: !form.needs[item.key].needed })}
                    className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors"
                    style={{ background: form.needs[item.key].needed ? C.rose : `${C.navy}15` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: form.needs[item.key].needed ? "translateX(20px)" : "translateX(0)" }} />
                  </button>
                </div>
                <input
                  value={form.needs[item.key].text}
                  onChange={(e) => updateNeed(item.key, { text: e.target.value })}
                  placeholder={item.textLabel}
                  className="w-full mt-2 rounded-lg border bg-white px-3 py-2 text-xs outline-none"
                  style={{ borderColor: `${C.navy}15`, color: C.navy }}
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-xs font-semibold" style={{ color: C.rose }}>{error}</p>}
        {message && <p className="text-xs font-semibold" style={{ color: C.green }}>{message}</p>}

        <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50" style={{ background: selectedRegistrationId ? C.green : C.blue }}>
          {submitting ? "Saving..." : selectedRegistrationId ? "Update Organization" : "Register Organization"}
        </button>
      </form>
    </motion.div>
  );
}

// ── OrgDashboard ───────────────────────────────────────────────────────────────
function OrgDashboard({ username, onSignOut }: { username: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<"dashboard" | "map" | "settings" | "needs" | "shifts" | "broadcasts" | "org-profile">("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(VOLUNTEER_NOTIFICATIONS);
  const unread = notifications.filter((n) => !n.read).length;
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.cream, fontFamily: "'Nunito', sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ background: C.cream }}>
        <div>
          <h1 className="text-xl font-extrabold leading-tight" style={{ color: C.navy }}>{greeting}, {displayName} 👋</h1>
        </div>
        <div className="relative">
          <button onClick={() => setNotifOpen((o) => !o)}
            className="relative w-11 h-11 rounded-2xl flex items-center justify-center transition-colors border shadow-sm"
            style={{ background: "rgba(255,255,255,0.9)", borderColor: `${C.navy}10` }} aria-label="Notifications">
            <Bell size={20} style={{ color: C.navy }} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow" style={{ background: C.rose }}>
                {unread}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-14 z-50 w-80 rounded-2xl bg-white shadow-2xl overflow-hidden border"
                style={{ borderColor: `${C.navy}10` }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${C.navy}08` }}>
                  <p className="font-extrabold text-sm" style={{ color: C.navy }}>Volunteer Sign-ups</p>
                  <button onClick={markAllRead} className="text-[10px] font-bold uppercase tracking-wider transition-colors" style={{ color: C.rose }}>Mark all read</button>
                </div>
                <ul className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: `${C.navy}06` }}>
                  {notifications.map((n) => (
                    <li key={n.id} className="flex items-start gap-3 px-4 py-3" style={{ background: n.read ? "transparent" : `${C.rose}08` }}>
                      <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: n.read ? "transparent" : C.rose }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight" style={{ color: C.navy }}>{n.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: `${C.navy}60` }}>{n.action} · {n.org}</p>
                      </div>
                      <span className="text-[10px] whitespace-nowrap mt-0.5" style={{ color: `${C.navy}40` }}>{n.time}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setNotifOpen(false)} className="w-full py-3 text-xs font-bold transition-colors border-t" style={{ color: `${C.navy}50`, borderColor: `${C.navy}08` }}>Close</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="px-4 py-2 pb-28 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {STATS.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/90 shadow-sm p-3 flex flex-col gap-2 border" style={{ borderColor: `${C.navy}08` }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                      <s.icon size={16} style={{ color: s.color }} />
                    </div>
                    <p className="text-2xl font-extrabold leading-none" style={{ color: C.navy }}>{s.value}</p>
                    <p className="text-[10px] font-bold leading-tight" style={{ color: `${C.navy}50` }}>{s.label}</p>
                    <p className="text-[10px] font-semibold leading-tight" style={{ color: s.color }}>{s.delta}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-white/90 shadow-sm overflow-hidden border" style={{ borderColor: `${C.navy}08` }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${C.navy}08` }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>Recent</p>
                    <h2 className="text-base font-extrabold" style={{ color: C.navy }}>Volunteer Sign-ups</h2>
                  </div>
                  <button onClick={() => setNotifOpen(true)} className="text-xs font-bold flex items-center gap-1 transition-colors" style={{ color: `${C.navy}50` }}>
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <ul>
                  {VOLUNTEER_NOTIFICATIONS.slice(0, 4).map((n, i) => (
                    <li key={n.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: `${C.navy}06` }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${C.rose}15` }}>
                        <Users size={15} style={{ color: C.rose }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: C.navy }}>{n.name}</p>
                        <p className="text-xs truncate" style={{ color: `${C.navy}55` }}>{n.org}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px]" style={{ color: `${C.navy}40` }}>{n.time}</span>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.rose }} />}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-white/90 shadow-sm overflow-hidden border" style={{ borderColor: `${C.navy}08` }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: `${C.navy}08` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>Quick Actions</p>
                  <h2 className="text-base font-extrabold" style={{ color: C.navy }}>Manage Your Org</h2>
                </div>
                {[
                  { label: "Register your organization", sub: "Create or edit organization profile details", icon: CheckCircle2, color: C.blue, target: "org-profile" as const },
                  { label: "Update needs list",       sub: "Tell donors what you need most",    icon: CheckCircle2, color: C.green, target: "needs" as const },
                  { label: "Schedule volunteer shift", sub: "Open a new slot for sign-ups",      icon: Users,        color: C.rose,  target: "shifts" as const },
                  { label: "Broadcast to nearby orgs",  sub: "Send an alert to partner nonprofits", icon: Heart,       color: C.blue,  target: "broadcasts" as const },
                ].map((action) => (
                  <button key={action.label} onClick={() => setTab(action.target)} className="w-full flex items-center gap-3 px-4 py-3.5 border-b last:border-0 transition-colors text-left hover:opacity-80"
                    style={{ borderColor: `${C.navy}06` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${action.color}18` }}>
                      <action.icon size={16} style={{ color: action.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: C.navy }}>{action.label}</p>
                      <p className="text-xs" style={{ color: `${C.navy}50` }}>{action.sub}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: `${C.navy}30` }} />
                  </button>
                ))}
              </div>

              <button onClick={onSignOut} className="w-full py-3.5 rounded-2xl border text-sm font-bold transition-colors" style={{ borderColor: `${C.navy}12`, color: `${C.navy}60` }}>
                Sign Out
              </button>
            </motion.div>
          )}

          {tab === "map" && (
            <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="pb-28">
              <DonorMapScreen onBack={() => setTab("dashboard")} />
            </motion.div>
          )}

          {tab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="px-4 pb-28 pt-2 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>Account</p>
                <h2 className="text-xl font-extrabold" style={{ color: C.navy }}>Settings</h2>
              </div>
              <div className="rounded-2xl bg-white/90 shadow-sm px-4 py-4 flex items-center gap-4 border" style={{ borderColor: `${C.navy}08` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: C.navy }}>
                  <span className="text-2xl font-extrabold text-white">{displayName.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-extrabold" style={{ color: C.navy }}>{displayName}</p>
                  <p className="text-xs" style={{ color: `${C.navy}50` }}>Organization Administrator</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${C.rose}15`, color: C.rose }}>Verified Org</span>
                </div>
              </div>
              {[
                { title: "Notifications", items: [{ label: "Volunteer sign-up alerts", enabled: true }, { label: "Broadcast confirmations", enabled: true }] },
                { title: "Privacy", items: [{ label: "Show org on public map", enabled: true }, { label: "Show contact info publicly", enabled: false }] },
              ].map((group) => (
                <div key={group.title} className="rounded-2xl bg-white/90 shadow-sm overflow-hidden border" style={{ borderColor: `${C.navy}08` }}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${C.navy}40` }}>{group.title}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.label} className="flex items-center justify-between px-4 py-3.5 border-t" style={{ borderColor: `${C.navy}06` }}>
                        <span className="text-sm font-semibold" style={{ color: C.navy }}>{item.label}</span>
                        <div className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors" style={{ background: item.enabled ? C.blue : `${C.navy}15` }}>
                          <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: item.enabled ? "translateX(20px)" : "translateX(0)" }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <button onClick={onSignOut} className="w-full py-3.5 rounded-2xl border text-sm font-bold transition-colors" style={{ background: `${C.rose}08`, borderColor: `${C.rose}25`, color: C.rose }}>
                Sign Out
              </button>
            </motion.div>
          )}

          {tab === "needs" && (
            <UpdateNeedsForm onBack={() => setTab("dashboard")} />
          )}

          {tab === "shifts" && (
            <VolunteerShiftForm onBack={() => setTab("dashboard")} />
          )}

          {tab === "broadcasts" && (
            <BroadcastForm onBack={() => setTab("dashboard")} />
          )}

          {tab === "org-profile" && (
            <OrganizationProfileForm onBack={() => setTab("dashboard")} defaultOrganizationName={displayName} />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t flex z-40" style={{ borderColor: `${C.navy}10` }}>
        {([
          { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { key: "map",       label: "Map View",  icon: MapIcon          },
          { key: "settings",  label: "Settings",  icon: Settings         },
        ] as const).map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)}
            className="flex-1 flex flex-col items-center gap-1 pt-3 pb-5 relative transition-colors"
            style={{ color: tab === item.key ? C.rose : `${C.navy}40` }}>
            <item.icon size={22} strokeWidth={tab === item.key ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
            {tab === item.key && (
              <motion.div layoutId="tab-indicator" className="absolute top-0 w-12 h-0.5 rounded-full" style={{ background: C.rose }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── BackButton ─────────────────────────────────────────────────────────────────
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-lg hover:bg-black/5 transition-colors" style={{ color: `${C.navy}60` }}>
      <ArrowLeft size={13} /> Back
    </button>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [logoScale, setLogoScale] = useState(1.6);
  const [showRing, setShowRing] = useState(true);
  const [orgSignInForm, setOrgSignInForm] = useState({ username: "", password: "" });
  const [orgCreateForm, setOrgCreateForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [orgAuthError, setOrgAuthError] = useState("");
  const [orgAuthSuccess, setOrgAuthSuccess] = useState("");
  const [orgUsername, setOrgUsername] = useState("admin");

  useEffect(() => {
    const ringTimer = setTimeout(() => {
      setShowRing(false);
      setTimeout(() => {
        setLogoScale(1);
        setTimeout(() => setScreen("home"), 600);
      }, 300);
    }, 1800);
    return () => clearTimeout(ringTimer);
  }, []);

  const LOGO_BASE = 100;
  const { W: logoW, totalH: logoH } = logoGeom(LOGO_BASE);

  const handleOrgSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOrgAuthSuccess("");
    const { username, password } = orgSignInForm;
    if (username.trim() === "admin" && password === "admin") {
      setOrgAuthError("");
      setOrgUsername(username.trim());
      setScreen("org-landing");
      return;
    }
    setOrgAuthError("Invalid credentials. Use username: admin and password: admin.");
  };

  const handleCreateAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOrgAuthError("");
    const { username, password, confirmPassword } = orgCreateForm;
    if (!username.trim() || !password || !confirmPassword) { setOrgAuthError("Please fill in username, password, and confirm password."); return; }
    if (password !== confirmPassword) { setOrgAuthError("Password and confirm password must match."); return; }
    setOrgAuthSuccess("Account successfully created.");
    setOrgUsername(username.trim());
    setTimeout(() => setScreen("org-landing"), 700);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative" style={{ fontFamily: "'Nunito', sans-serif", background: C.cream }}>
      {screen !== "donor-map" && screen !== "org-landing" && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <MapBackground />
        </div>
      )}

      {/* ── Loading / Home ── */}
      {(screen === "loading" || screen === "home") && (
        <div className="relative flex flex-col items-center gap-8">
          <div className="relative flex items-center justify-center"
            style={{
              width: logoW * logoScale + 60,
              height: logoH * logoScale + 60,
              transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1), height 0.6s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
            <motion.div animate={{ scale: logoScale }} transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }} style={{ originX: 0.5, originY: 0.5 }}>
              <PinhelpLogo size={LOGO_BASE} />
            </motion.div>
            <AnimatePresence>
              {showRing && <LoadingRing size={LOGO_BASE} />}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {screen === "home" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-col gap-3 w-full max-w-xs"
              >
                <button onClick={() => setScreen("org-choice")}
                  className="group flex flex-row items-center gap-4 px-7 py-5 rounded-2xl backdrop-blur-sm border shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.85)", borderColor: `${C.blue}25` }}>
                  <span className="flex-shrink-0 transition-colors duration-200 group-hover:opacity-80">
                    <OrgIcon size={44} />
                  </span>
                  <span className="text-base font-semibold tracking-wide" style={{ color: C.navy }}>Organization</span>
                </button>

                <button onClick={() => setScreen("donor-map")}
                  className="group flex flex-row items-center gap-4 px-7 py-5 rounded-2xl backdrop-blur-sm border shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.85)", borderColor: `${C.rose}25` }}>
                  <span className="flex-shrink-0 transition-colors duration-200 group-hover:opacity-80">
                    <DonorIcon size={44} />
                  </span>
                  <span className="text-base font-semibold tracking-wide" style={{ color: C.navy }}>Donor</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Org Choice ── */}
      <AnimatePresence>
        {screen === "org-choice" && (
          <motion.div key="org-choice" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.45 }} className="flex flex-col items-center gap-4 px-6">
            <div className="flex flex-col items-center gap-2 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border" style={{ borderColor: `${C.navy}08` }}>
              <div className="w-full flex justify-start -ml-2 mb-1"><BackButton onClick={() => setScreen("home")} /></div>
              <PinhelpLogo size={44} />
              <h2 className="text-3xl font-extrabold mt-2" style={{ color: C.navy }}>Organization</h2>
              <p className="text-sm" style={{ color: `${C.navy}60` }}>{"Choose how you'd like to continue"}</p>
              <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
                <button onClick={() => setScreen("create-account")} className="w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md" style={{ background: C.blue }}>Create Account</button>
                <button onClick={() => { setOrgAuthError(""); setOrgAuthSuccess(""); setOrgSignInForm({ username: "", password: "" }); setScreen("org-signin"); }} className="w-full py-4 rounded-xl border font-semibold text-base bg-white/50 hover:bg-white/80 transition-colors" style={{ color: C.navy, borderColor: `${C.navy}15` }}>Sign In</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Org Sign In ── */}
      <AnimatePresence>
        {screen === "org-signin" && (
          <motion.div key="org-signin" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.45 }} className="flex flex-col items-center gap-4 px-6">
            <div className="flex flex-col items-center gap-2 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border w-full max-w-md" style={{ borderColor: `${C.navy}08` }}>
              <div className="w-full flex justify-start -ml-2 mb-1"><BackButton onClick={() => { setOrgAuthError(""); setOrgAuthSuccess(""); setScreen("org-choice"); }} /></div>
              <PinhelpLogo size={44} />
              <h2 className="text-3xl font-extrabold mt-2" style={{ color: C.navy }}>Organization Sign In</h2>
              <form className="flex flex-col gap-3 w-full mt-4" onSubmit={handleOrgSignIn}>
                <input type="text" value={orgSignInForm.username} onChange={(e) => setOrgSignInForm((c) => ({ ...c, username: e.target.value }))} placeholder="Username" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
                <input type="password" value={orgSignInForm.password} onChange={(e) => setOrgSignInForm((c) => ({ ...c, password: e.target.value }))} placeholder="Password" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
                {orgAuthError && <p className="text-xs font-semibold" style={{ color: C.rose }}>{orgAuthError}</p>}
                <button type="submit" className="w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md" style={{ background: C.blue }}>Sign In</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Account ── */}
      <AnimatePresence>
        {screen === "create-account" && (
          <motion.div key="create-account" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.45 }} className="flex flex-col items-center gap-4 px-6">
            <div className="flex flex-col items-center gap-2 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border" style={{ borderColor: `${C.navy}08` }}>
              <div className="w-full flex justify-start -ml-2 mb-1"><BackButton onClick={() => setScreen("org-choice")} /></div>
              <PinhelpLogo size={44} />
              <h2 className="text-3xl font-extrabold mt-2" style={{ color: C.navy }}>Create Account</h2>
              <p className="text-sm text-center max-w-xs" style={{ color: `${C.navy}60` }}>This is a dummy create account form for UI demo flow.</p>
              <form className="flex flex-col gap-3 w-full max-w-xs mt-4" onSubmit={handleCreateAccount}>
                <input type="text" value={orgCreateForm.username} onChange={(e) => setOrgCreateForm((c) => ({ ...c, username: e.target.value }))} placeholder="Username" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
                <input type="password" value={orgCreateForm.password} onChange={(e) => setOrgCreateForm((c) => ({ ...c, password: e.target.value }))} placeholder="Password" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
                <input type="password" value={orgCreateForm.confirmPassword} onChange={(e) => setOrgCreateForm((c) => ({ ...c, confirmPassword: e.target.value }))} placeholder="Confirm Password" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
                {orgAuthError && <p className="text-xs font-semibold" style={{ color: C.rose }}>{orgAuthError}</p>}
                {orgAuthSuccess && <p className="text-xs font-semibold" style={{ color: C.green }}>{orgAuthSuccess}</p>}
                <button type="submit" className="w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md" style={{ background: C.blue }}>Create Account</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Organization Dashboard ── */}
      {screen === "org-landing" && (
        <OrgDashboard username={orgUsername} onSignOut={() => { setOrgAuthError(""); setOrgAuthSuccess(""); setOrgSignInForm({ username: "", password: "" }); setOrgCreateForm({ username: "", password: "", confirmPassword: "" }); setScreen("home"); }} />
      )}

      {/* ── Donor Map ── */}
      <AnimatePresence>
        {screen === "donor-map" && (
          <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: C.cream }}>
            <DonorMapScreen onBack={() => setScreen("home")} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
