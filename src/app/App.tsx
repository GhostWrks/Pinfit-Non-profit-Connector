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

// ── Donor filter definitions ──────────────────────────────────────────────────
const DONATION_FILTERS = [
  { key: "food",      label: "Food",               items: ["Canned goods", "Fresh produce", "Baby formula", "Bread & grains", "Cooking oil", "Cereal", "Protein items"] },
  { key: "clothing",  label: "Clothing",            items: ["Men's wear", "Women's wear", "Kids' clothes", "Shoes & boots", "Winter coats", "Work clothes"] },
  { key: "furniture", label: "Furniture",           items: ["Beds & mattresses", "Tables & chairs", "Dressers", "Small appliances", "Linens & bedding"] },
  { key: "baby",      label: "Baby Items",          items: ["Diapers", "Baby formula", "Baby clothes", "Strollers", "Car seats", "Toys"] },
  { key: "hygiene",   label: "Hygiene & Household", items: ["Soap & shampoo", "Toothbrushes", "Feminine products", "Cleaning supplies", "Paper goods"] },
];

const LOCATION_TAGS = [
  { value: "food", label: "Food" }, { value: "education", label: "Education" },
  { value: "housing", label: "Housing" }, { value: "health", label: "Health" },
  { value: "clothing", label: "Clothing" },
];

const SUGGESTION_POOL = [
  ...SEED_NONPROFITS.map((o) => o.name),
  "Redlands", "Fontana", "Colton", "San Bernardino", "Riverside",
  "92373", "92335", "92324", "92401", "92501",
  "food", "education", "housing", "health", "clothing",
  "canned goods", "fresh produce", "winter coats", "baby formula", "volunteers",
];

// ── DonorMapScreen ─────────────────────────────────────────────────────────────
function DonorMapScreen({ onBack }: { onBack: () => void }) {
  const [queryText, setQueryText]     = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults]         = useState<NonprofitResult[]>(SEED_NONPROFITS);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const mapRef   = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Filter state
  const [openSection, setOpenSection]         = useState<"volunteers" | "donations" | "location" | null>(null);
  const [volunteersFilter, setVolunteersFilter] = useState<"any" | "needed" | "not-needed">("any");
  const [selectedDonationItems, setSelectedDonationItems] = useState<Set<string>>(new Set());
  const [selectedLocationTags, setSelectedLocationTags]   = useState<Set<string>>(new Set());
  const [expandedDonCat, setExpandedDonCat]   = useState<string | null>(null);

  // Autocomplete suggestions (typed query only)
  const suggestions = useMemo(() => {
    if (queryText.length < 2) return [];
    const q = queryText.toLowerCase();
    return [...new Set(SUGGESTION_POOL)].filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  }, [queryText]);

  // Re-filter whenever search query or filter selections change
  useEffect(() => {
    const q = activeQuery.toLowerCase().trim();
    setResults(
      SEED_NONPROFITS.filter((org) => {
        const allItems = [...org.needs, ...org.offers].flatMap((g) => [g.category, ...g.items]);
        const matchQ = !q || org.name.toLowerCase().includes(q) || org.address.toLowerCase().includes(q) || org.zip.includes(q) || allItems.some((s) => s.toLowerCase().includes(q));
        const matchVol = volunteersFilter === "any" || (volunteersFilter === "needed" && org.volunteersNeeded) || (volunteersFilter === "not-needed" && !org.volunteersNeeded);
        const matchDonation = selectedDonationItems.size === 0 || [...org.needs, ...org.offers].flatMap((g) => g.items).some((item) => selectedDonationItems.has(item));
        const matchTag = selectedLocationTags.size === 0 || selectedLocationTags.has(org.category);
        return matchQ && matchVol && matchDonation && matchTag;
      })
    );
    setSelectedOrgId(null);
  }, [activeQuery, volunteersFilter, selectedDonationItems, selectedLocationTags]);

  const handleSubmit = () => {
    setShowSuggestions(false);
    setActiveQuery(queryText);
  };

  const handlePinClick = (org: NonprofitResult) =>
    setSelectedOrgId((prev) => (prev === org.id ? null : org.id));

  const handleShowOnMap = (org: NonprofitResult) => {
    setSelectedOrgId(org.id);
    setTimeout(() => mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const toggleDonationItem = (item: string) =>
    setSelectedDonationItems((prev) => { const n = new Set(prev); n.has(item) ? n.delete(item) : n.add(item); return n; });

  const toggleLocationTag = (tag: string) =>
    setSelectedLocationTags((prev) => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n; });

  const clearAllFilters = () => {
    setVolunteersFilter("any");
    setSelectedDonationItems(new Set());
    setSelectedLocationTags(new Set());
  };

  const activeFilterCount = (volunteersFilter !== "any" ? 1 : 0) + selectedDonationItems.size + selectedLocationTags.size;
  const selectedOrg = results.find((o) => o.id === selectedOrgId) ?? null;

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
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>PinHelp</p>
          <h1 className="text-4xl font-extrabold leading-tight" style={{ color: C.navy }}>Donations Map</h1>
        </div>
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center border shadow-sm transition-colors hover:opacity-70"
          style={{ borderColor: `${C.navy}15`, background: "rgba(255,255,255,0.9)", color: C.navy }} aria-label="Exit">
          <X size={18} />
        </button>
      </div>

      {/* ── Search + Filters ── */}
      <div className="px-4 pb-3 space-y-2.5">
        {/* Search bar */}
        <div className="relative">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex items-center gap-2 bg-white rounded-2xl border shadow-sm px-4 py-3.5"
            style={{ borderColor: `${C.blue}25` }}>
            <Search size={17} style={{ color: `${C.navy}40` }} className="flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={queryText}
              onChange={(e) => { setQueryText(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search by city, zip, org name, category…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:opacity-35"
              style={{ color: C.navy }}
            />
            <button type="submit"
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: C.blue, color: "#fff" }} aria-label="Search">
              <CornerDownLeft size={15} />
            </button>
          </form>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.13 }}
                className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border shadow-xl z-50 overflow-hidden"
                style={{ borderColor: `${C.blue}20` }}>
                {suggestions.map((s, i) => (
                  <button key={i} type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left border-b last:border-0 transition-colors"
                    style={{ borderColor: `${C.navy}07`, color: C.navy }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${C.blue}08`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onMouseDown={() => { setQueryText(s); setActiveQuery(s); setShowSuggestions(false); }}>
                    <Search size={12} style={{ color: `${C.navy}30` }} />
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter dropdown row — 3 equal pills */}
        <div className="flex gap-2">
          {[
            {
              key: "volunteers" as const,
              label: "Volunteers",
              icon: Users,
              active: volunteersFilter !== "any",
              count: 0,
              activeColor: C.rose,
            },
            {
              key: "donations" as const,
              label: "Donations",
              icon: Heart,
              active: selectedDonationItems.size > 0,
              count: selectedDonationItems.size,
              activeColor: C.blue,
            },
            {
              key: "location" as const,
              label: "Tags",
              icon: MapPinIcon,
              active: selectedLocationTags.size > 0,
              count: selectedLocationTags.size,
              activeColor: C.green,
            },
          ].map((pill) => (
            <button key={pill.key}
              onClick={() => setOpenSection((prev) => prev === pill.key ? null : pill.key)}
              className="flex-1 flex items-center justify-between gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold border transition-all"
              style={pill.active
                ? { background: `${pill.activeColor}14`, borderColor: pill.activeColor, color: pill.activeColor }
                : { background: "rgba(255,255,255,0.9)", borderColor: `${C.navy}15`, color: `${C.navy}60` }}>
              <span className="flex items-center gap-1.5">
                <pill.icon size={12} />
                {pill.label}
                {pill.count > 0 && (
                  <span className="rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-extrabold text-white" style={{ background: pill.activeColor }}>
                    {pill.count}
                  </span>
                )}
              </span>
              <ChevronRight size={12} className="transition-transform duration-150"
                style={{ transform: openSection === pill.key ? "rotate(90deg)" : "none" }} />
            </button>
          ))}
        </div>

        {/* Filter panels */}
        <AnimatePresence>
          {openSection === "volunteers" && (
            <motion.div key="vol-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              <div className="bg-white rounded-xl border p-4 space-y-1.5" style={{ borderColor: `${C.navy}12` }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: `${C.navy}45` }}>Volunteer Status</p>
                {([
                  { value: "any",        label: "Any organization" },
                  { value: "needed",     label: "Needs volunteers" },
                  { value: "not-needed", label: "No volunteers needed" },
                ] as const).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 py-1 cursor-pointer" onClick={() => setVolunteersFilter(opt.value)}>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ borderColor: volunteersFilter === opt.value ? C.rose : `${C.navy}20`, background: volunteersFilter === opt.value ? C.rose : "transparent" }}>
                      {volunteersFilter === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm" style={{ color: C.navy }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {openSection === "donations" && (
            <motion.div key="don-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: `${C.navy}12` }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: `${C.navy}45` }}>Donation Types</p>
                {DONATION_FILTERS.map((cat) => {
                  const selectedInCat = cat.items.filter((i) => selectedDonationItems.has(i)).length;
                  return (
                    <div key={cat.key}>
                      <button
                        className="w-full flex items-center justify-between py-2.5 text-sm font-bold transition-colors"
                        onClick={() => setExpandedDonCat((prev) => prev === cat.key ? null : cat.key)}
                        style={{ color: C.navy }}>
                        <span>{cat.label}</span>
                        <span className="flex items-center gap-1.5" style={{ color: `${C.navy}40` }}>
                          {selectedInCat > 0 && (
                            <span className="rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-extrabold text-white" style={{ background: C.blue }}>{selectedInCat}</span>
                          )}
                          <ChevronRight size={12} className="transition-transform duration-150"
                            style={{ transform: expandedDonCat === cat.key ? "rotate(90deg)" : "none" }} />
                        </span>
                      </button>
                      <AnimatePresence>
                        {expandedDonCat === cat.key && (
                          <motion.div key={cat.key + "-items"} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.14 }} className="overflow-hidden">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-3 pb-3">
                              {cat.items.map((item) => (
                                <label key={item} className="flex items-center gap-2 py-1 cursor-pointer" onClick={() => toggleDonationItem(item)}>
                                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                                    style={{ borderColor: selectedDonationItems.has(item) ? C.blue : `${C.navy}20`, background: selectedDonationItems.has(item) ? C.blue : "transparent" }}>
                                    {selectedDonationItems.has(item) && <span className="text-white font-extrabold" style={{ fontSize: 9 }}>✓</span>}
                                  </div>
                                  <span className="text-xs" style={{ color: `${C.navy}75` }}>{item}</span>
                                </label>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="border-b" style={{ borderColor: `${C.navy}07` }} />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {openSection === "location" && (
            <motion.div key="loc-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: `${C.navy}12` }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: `${C.navy}45` }}>Category Tags</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {LOCATION_TAGS.map((tag) => (
                    <label key={tag.value} className="flex items-center gap-2.5 py-1 cursor-pointer" onClick={() => toggleLocationTag(tag.value)}>
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ borderColor: selectedLocationTags.has(tag.value) ? C.green : `${C.navy}20`, background: selectedLocationTags.has(tag.value) ? C.green : "transparent" }}>
                        {selectedLocationTags.has(tag.value) && <span className="text-white font-extrabold" style={{ fontSize: 9 }}>✓</span>}
                      </div>
                      <span className="text-sm" style={{ color: C.navy }}>{tag.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {volunteersFilter !== "any" && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border"
                style={{ background: `${C.rose}10`, borderColor: `${C.rose}40`, color: C.rose }}>
                {volunteersFilter === "needed" ? "Volunteers" : "No volunteers"}
                <button onClick={() => setVolunteersFilter("any")}><X size={10} /></button>
              </span>
            )}
            {[...selectedDonationItems].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border"
                style={{ background: `${C.blue}10`, borderColor: `${C.blue}40`, color: C.blue }}>
                {item}
                <button onClick={() => toggleDonationItem(item)}><X size={10} /></button>
              </span>
            ))}
            {[...selectedLocationTags].map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border"
                style={{ background: `${C.green}10`, borderColor: `${C.green}40`, color: C.green }}>
                {tag}
                <button onClick={() => toggleLocationTag(tag)}><X size={10} /></button>
              </span>
            ))}
            <button onClick={clearAllFilters} className="text-[11px] font-bold underline underline-offset-2 ml-1 transition-opacity hover:opacity-60"
              style={{ color: `${C.navy}45` }}>Clear all</button>
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} className="relative mx-4 mb-3 rounded-2xl overflow-hidden shadow-md border"
        style={{ height: 500, borderColor: `${C.blue}18` }}>
        <div className="absolute inset-0">
          <InteractiveMap results={results} selectedOrgId={selectedOrgId} onPinClick={handlePinClick} />
        </div>
        <AnimatePresence>
          {selectedOrg && (
            <MapPopup key={selectedOrg.id} org={selectedOrg} onClose={() => setSelectedOrgId(null)} />
          )}
        </AnimatePresence>
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-[10px] font-semibold space-y-1 z-10 border"
          style={{ borderColor: `${C.navy}10` }}>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: C.rose }} /><span style={{ color: `${C.navy}65` }}>Volunteers needed</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: C.green }} /><span style={{ color: `${C.navy}65` }}>Donations accepted</span></div>
        </div>
        <div className="absolute bottom-3 right-3 text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg z-10"
          style={{ background: C.navy }}>
          {results.length} showing
        </div>
      </div>

      {/* ── Selected org expanded detail panel ── */}
      <AnimatePresence>
        {selectedOrg && (
          <motion.div
            key={selectedOrg.id + "-detail"}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="mx-4 mb-3 rounded-2xl border shadow-xl overflow-hidden"
            style={{ borderColor: C.rose, background: "#fffdf9", boxShadow: `0 12px 40px ${C.rose}22` }}>
            {/* Detail header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b"
              style={{ borderColor: `${C.rose}18`, background: `${C.rose}05` }}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>Selected</span>
                <h3 className="text-lg font-extrabold leading-tight mt-0.5" style={{ color: C.navy }}>{selectedOrg.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: `${C.navy}50` }}>{selectedOrg.address}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: selectedOrg.volunteersNeeded ? `${C.rose}18` : `${C.green}18`, color: selectedOrg.volunteersNeeded ? C.rose : C.green }}>
                  {selectedOrg.volunteersNeeded ? "Volunteers" : "Donations"}
                </span>
                <button onClick={() => setSelectedOrgId(null)} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:opacity-60"
                  style={{ background: `${C.navy}10`, color: C.navy }} aria-label="Close">
                  <X size={14} />
                </button>
              </div>
            </div>
            {/* Detail body — 3 columns on desktop */}
            <div className="px-5 py-4 grid md:grid-cols-3 gap-5">
              {/* Column 1 — About + Contact */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: `${C.navy}40` }}>About</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: `${C.navy}60` }}>{selectedOrg.description}</p>
                <div className="space-y-1.5">
                  <a href={`tel:${selectedOrg.contactPhone}`} className="flex items-center gap-2 text-xs hover:opacity-70 transition-opacity">
                    <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 font-bold text-[10px]" style={{ background: `${C.blue}15`, color: C.blue }}>✆</span>
                    <span style={{ color: `${C.navy}70` }}>{selectedOrg.contactPhone}</span>
                  </a>
                  <a href={`mailto:${selectedOrg.contactEmail}`} className="flex items-center gap-2 text-xs hover:opacity-70 transition-opacity">
                    <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 font-bold text-[10px]" style={{ background: `${C.blue}15`, color: C.blue }}>@</span>
                    <span style={{ color: `${C.navy}70` }}>{selectedOrg.contactEmail}</span>
                  </a>
                  <a href={`https://${selectedOrg.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs hover:opacity-70 transition-opacity">
                    <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 font-bold text-[10px]" style={{ background: `${C.blue}15`, color: C.blue }}>↗</span>
                    <span style={{ color: `${C.navy}70` }}>{selectedOrg.website}</span>
                  </a>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 font-bold text-[10px]" style={{ background: `${C.green}15`, color: C.green }}>◷</span>
                    <span style={{ color: `${C.navy}65` }}>{selectedOrg.hours}</span>
                  </div>
                </div>
              </div>
              {/* Column 2 — Offers */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.green }}>Offers</p>
                {selectedOrg.offers.map((group) => (
                  <div key={group.category} className="mb-2.5">
                    <p className="text-[11px] font-bold mb-1" style={{ color: C.navy }}>{group.category}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {group.items.map((item) => (
                        <span key={item} className="flex items-center gap-1 text-xs" style={{ color: `${C.navy}70` }}>
                          <span style={{ color: C.green }}>✓</span>{item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Column 3 — Needs */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.rose }}>Needs</p>
                {selectedOrg.needs.map((group) => (
                  <div key={group.category} className="mb-2.5">
                    <p className="text-[11px] font-bold mb-1" style={{ color: C.navy }}>{group.category}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {group.items.map((item) => (
                        <span key={item} className="flex items-center gap-1 text-xs" style={{ color: `${C.navy}70` }}>
                          <span style={{ color: C.rose }}>○</span>{item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Horizontal scrollable results ── */}
      <section className="pb-10">
        <div className="flex items-center justify-between px-5 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: C.rose }}>Results</p>
            <h2 className="text-lg font-extrabold" style={{ color: C.navy }}>{results.length} organization{results.length !== 1 ? "s" : ""}</h2>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="text-xs font-bold transition-opacity hover:opacity-60" style={{ color: `${C.navy}45` }}>Clear filters</button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="mx-4 rounded-2xl border border-dashed px-4 py-10 text-sm text-center"
            style={{ borderColor: `${C.navy}18`, color: `${C.navy}50`, background: C.cream }}>
            No matches. Try adjusting search or filters.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4 px-4" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            {results.map((org) => (
              <motion.article
                key={org.id}
                animate={selectedOrgId === org.id ? { scale: 1.025, y: -5 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 w-68 rounded-2xl border p-4 shadow-sm cursor-pointer flex flex-col gap-3"
                style={{
                  width: 272,
                  borderColor: selectedOrgId === org.id ? C.rose : `${C.navy}10`,
                  background: selectedOrgId === org.id ? `${C.rose}05` : "#fffdf9",
                  boxShadow: selectedOrgId === org.id ? `0 8px 28px ${C.rose}22` : "0 2px 10px rgba(26,26,46,0.07)",
                }}
                onClick={() => handlePinClick(org)}>
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold leading-snug" style={{ color: C.navy }}>{org.name}</h3>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: `${C.navy}50` }}>{org.address}</p>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white flex-shrink-0"
                    style={{ background: C.navy }}>{org.category}</span>
                </div>

                <p className="text-[11px] leading-relaxed" style={{ color: `${C.navy}60`, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                  {org.description}
                </p>

                {/* Quick offer/need preview */}
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {org.offers.flatMap((g) => g.items).slice(0, 3).map((item) => (
                    <span key={item} className="text-[10px] rounded-full px-2 py-0.5 font-semibold"
                      style={{ background: `${C.green}15`, color: C.green }}>✓ {item}</span>
                  ))}
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between gap-2 pt-1 mt-auto border-t" style={{ borderColor: `${C.navy}08` }}>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: org.volunteersNeeded ? `${C.rose}15` : `${C.green}15`, color: org.volunteersNeeded ? C.rose : C.green }}>
                    {org.volunteersNeeded ? "Volunteers" : "Donations"}
                  </span>
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); handleShowOnMap(org); }}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border transition-colors hover:opacity-75"
                    style={{ borderColor: `${C.navy}15`, color: C.navy }}>
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
function OrgDashboard({ username, onSignOut }: { username: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<"dashboard" | "map" | "settings">("dashboard");
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
                  { label: "Update needs list",       sub: "Tell donors what you need most",    icon: CheckCircle2, color: C.green },
                  { label: "Schedule volunteer shift", sub: "Open a new slot for sign-ups",      icon: Users,        color: C.rose  },
                  { label: "Broadcast to nearby orgs",  sub: "Send an alert to partner nonprofits", icon: Heart,       color: C.blue  },
                ].map((action) => (
                  <button key={action.label} className="w-full flex items-center gap-3 px-4 py-3.5 border-b last:border-0 transition-colors text-left hover:opacity-80"
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
            <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="px-4 pb-28 pt-2">
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: C.rose }}>Area Overview</p>
                <h2 className="text-xl font-extrabold" style={{ color: C.navy }}>Nearby Organizations</h2>
              </div>
              <div className="rounded-2xl overflow-hidden border shadow-md" style={{ minHeight: 340, borderColor: `${C.navy}10` }}>
                <InteractiveMap results={SEED_NONPROFITS} selectedOrgId={null} onPinClick={() => {}} />
              </div>
              <div className="mt-3 space-y-2">
                {SEED_NONPROFITS.map((org) => (
                  <div key={org.id} className="rounded-xl bg-white/80 px-4 py-3 flex items-center gap-3 border" style={{ borderColor: `${C.navy}08` }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: org.volunteersNeeded ? C.rose : C.green }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: C.navy }}>{org.name}</p>
                      <p className="text-xs truncate" style={{ color: `${C.navy}55` }}>{org.address}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${C.navy}40` }}>{org.category}</span>
                  </div>
                ))}
              </div>
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
              <p className="text-sm text-center max-w-xs" style={{ color: `${C.navy}60` }}>Dummy login for demo: username admin and password admin.</p>
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
