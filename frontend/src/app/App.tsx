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

const REGISTRATIONS_ENDPOINT = "/api/registrations";
const VOLUNTEER_SHIFTS_ENDPOINT = "/api/volunteer-shifts";
const BROADCASTS_ENDPOINT = "/api/broadcasts";

type Screen = "loading" | "home" | "org-choice" | "org-signin" | "create-account" | "org-landing" | "org-register" | "org-shifts" | "org-broadcasts" | "donor-map";

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
  source?: "arcgis" | "registration";
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
        "esri/Graphic",
        "esri/views/MapView",
        "esri/widgets/LayerList",
        "esri/widgets/Search"
      ],
      (...modules) => resolve(modules),
      reject
    );
  });

type RegistrationRow = {
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
  needVolunteers: boolean;
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
  latitude: number;
  longitude: number;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

// ── DonorMapScreen ─────────────────────────────────────────────────────────────
function DonorMapScreen({ onBack }: { onBack: () => void }) {
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
  const graphicCtorRef = useRef<any>(null);
  const layerQueryUrlRef = useRef<string>("");
  const definitionExpressionRef = useRef<string>("");
  const availableFieldsRef = useRef<Set<string>>(new Set());
  const featureByIdRef = useRef<Map<string, any>>(new Map());
  const registrationGraphicsRef = useRef<Map<string, any>>(new Map());

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

  const buildDefinitionExpression = () => {
    const clauses: string[] = [];
    const q = queryText.trim();

    if (q) {
      const qEsc = escapeSql(q.toUpperCase());
      const qParts = [
        `UPPER(Company_Business_Name) LIKE '%${qEsc}%'`,
        `UPPER(City) LIKE '%${qEsc}%'`,
        `UPPER(Mission_Area) LIKE '%${qEsc}%'`,
        `UPPER(Esri_Category_Description) LIKE '%${qEsc}%'`
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
      source: "arcgis",
    };
  };

  const loadRegistrationResults = async () => {
    try {
      const response = await fetch(REGISTRATIONS_ENDPOINT, { cache: "no-store" });
      if (!response.ok) {
        return [] as ArcgisOrgResult[];
      }

      const payload = await response.json();
      const rows: RegistrationRow[] = Array.isArray(payload?.registrations) ? payload.registrations : [];

      const mapped = rows
        .map((row, idx) => {
          const lat = Number(row.latitude);
          const lon = Number(row.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return null;
          }

          const name = String(row.organizationName || `Organization ${idx + 1}`);
          const city = String(row.city || "");
          const zip = String(row.zip || "");
          const missionArea = String(row.missionArea || "");
          const address = String(row.address || "Address unavailable");

          const textBlob = `${missionArea} ${String(row.description || "")} ${String(row.industryDescription || "")} ${String(row.esriCategoryDescription || "")} ${name}`.toLowerCase();
          const categoriesSet = new Set<string>();
          RESOURCE_FILTERS.forEach((item) => {
            const hasText = item.keywords.some((kw) => textBlob.includes(kw));
            if (hasText) categoriesSet.add(item.label);
          });

          const feature = {
            attributes: {
              ObjectId: String(row.id || `reg-${idx + 1}`),
              Company_Business_Name: name,
              City: city,
              State_Abbreviation: String(row.stateAbbreviation || ""),
              ZIP_Code: zip,
              Industry_Description: String(row.industryDescription || ""),
              Employee_Count: String(row.employeeCount || ""),
              Esri_Category_Description: String(row.esriCategoryDescription || ""),
              Mission_Area: missionArea,
              Address__: address,
              Main_Contact: String(row.mainContact || ""),
              Contact_Email: String(row.contactEmail || ""),
              Website_Link: String(row.websiteLink || ""),
              Working_Hours: String(row.workingHours || ""),
              Matched_Address: String(row.matchedAddress || ""),
              Organization_Description: String(row.description || ""),
              Need_Volunteers: row.needVolunteers ? "Yes" : "No",
              Food_Y_N: String(row.foodYN || "No"),
              Food_Text: String(row.foodText || ""),
              Clothes_Y_N: String(row.clothesYN || "No"),
              Clothes_Text: String(row.clothesText || ""),
              Shelter_Y_N: String(row.shelterYN || "No"),
              Shelter_Text: String(row.shelterText || ""),
              Bedding_Y_N: String(row.beddingYN || "No"),
              Bedding_Text: String(row.beddingText || ""),
              Toiletries_Y_N: String(row.toiletriesYN || "No"),
              Toiletries_Text: String(row.toiletriesText || ""),
              Furniture_Y_N: String(row.furnitureYN || "No"),
              Furniture_Text: String(row.furnitureText || ""),
              Medical_Supplies_Y_N: String(row.medicalSuppliesYN || "No"),
              Medical_Supplies_Text: String(row.medicalSuppliesText || ""),
              Electronics_Y_N: String(row.electronicsYN || "No"),
              Electronics_Text: String(row.electronicsText || ""),
              Education_Materials_Y_N: String(row.educationMaterialsYN || "No"),
              Education_Materials_Text: String(row.educationMaterialsText || ""),
              Baby_Items_Y_N: String(row.babyItemsYN || "No"),
              Baby_Items_Text: String(row.babyItemsText || ""),
              Cleaning_Items_Y_N: String(row.cleaningItemsYN || "No"),
              Cleaning_Items_Text: String(row.cleaningItemsText || ""),
              Source: "Organization Registration",
            },
            geometry: {
              type: "point",
              latitude: lat,
              longitude: lon,
            },
          };

          return {
            id: String(row.id || `reg-${idx + 1}`),
            name,
            city,
            zip,
            missionArea,
            address,
            volunteersNeeded: Boolean(row.needVolunteers),
            categories: Array.from(categoriesSet),
            feature,
            source: "registration" as const,
          };
        })
        .filter((item): item is ArcgisOrgResult => item !== null);

      return mapped;
    } catch {
      return [] as ArcgisOrgResult[];
    }
  };

  const renderRegistrationGraphics = (registrationResults: ArcgisOrgResult[]) => {
    const view = mapViewRef.current;
    const Graphic = graphicCtorRef.current;
    const sourceLayer = sourceLayerRef.current;
    if (!view || !Graphic) {
      return;
    }

    const renderer = sourceLayer?.renderer;
    const fallbackSymbol = {
      type: "simple-marker",
      color: "#f4b942",
      size: 7,
      outline: {
        color: "#d9480f",
        width: 1.5,
      },
    };

    const resolveLayerSymbol = (graphic: any) => {
      try {
        if (renderer?.getSymbol) {
          const symbolFromRenderer = renderer.getSymbol(graphic);
          if (symbolFromRenderer) {
            return symbolFromRenderer.clone ? symbolFromRenderer.clone() : symbolFromRenderer;
          }
        }

        if (renderer?.defaultSymbol) {
          return renderer.defaultSymbol.clone ? renderer.defaultSymbol.clone() : renderer.defaultSymbol;
        }

        if (renderer?.symbol) {
          return renderer.symbol.clone ? renderer.symbol.clone() : renderer.symbol;
        }
      } catch {
        // Use fallback if renderer lookup fails.
      }

      return fallbackSymbol;
    };

    if (registrationGraphicsRef.current.size > 0) {
      view.graphics.removeMany([...registrationGraphicsRef.current.values()]);
    }
    registrationGraphicsRef.current.clear();

    const graphics = registrationResults
      .map((org) => {
        const geom = org.feature?.geometry;
        const lat = Number(geom?.latitude);
        const lon = Number(geom?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          return null;
        }

        const graphic = new Graphic({
          geometry: {
            type: "point",
            latitude: lat,
            longitude: lon,
          },
          attributes: {
            ObjectId: org.id,
            Company_Business_Name: org.name,
            City: org.city,
            ZIP_Code: org.zip,
            Mission_Area: org.missionArea,
            Address__: org.address,
            Source: "Organization Registration",
          },
          popupTemplate: {
            title: "{Company_Business_Name}",
            content: [
              {
                type: "fields",
                fieldInfos: [
                  { fieldName: "Address__", label: "Address" },
                  { fieldName: "City", label: "City" },
                  { fieldName: "ZIP_Code", label: "ZIP" },
                  { fieldName: "Mission_Area", label: "Mission Area" },
                  { fieldName: "Source", label: "Source" },
                ],
              },
            ],
          },
        });

        graphic.symbol = resolveLayerSymbol(graphic);
        return graphic;
      })
      .filter(Boolean);

    if (graphics.length > 0) {
      view.graphics.addMany(graphics);
      graphics.forEach((graphic: any) => {
        const id = String(graphic?.attributes?.ObjectId || "");
        if (id) {
          registrationGraphicsRef.current.set(id, graphic);
        }
      });
    }
  };

  const refreshResults = async () => {
    const sourceLayer = sourceLayerRef.current;

    setIsLoading(true);
    setError("");
    try {
      const where = definitionExpressionRef.current || sourceLayer?.definitionExpression || "1=1";
      const apiKey = window.__APP_CONFIG?.arcgisApiKey || "";
      let serviceUrl = layerQueryUrlRef.current || "";
      if (!serviceUrl) {
        const itemParams = new URLSearchParams({ f: "json" });
        if (apiKey) {
          itemParams.set("token", apiKey);
        }
        const itemResponse = await fetch(
          `https://www.arcgis.com/sharing/rest/content/items/${DONOR_FEATURE_LAYER_ITEM_ID}?${itemParams.toString()}`
        );
        const itemPayload = await itemResponse.json();
        const baseUrl = String(itemPayload?.url || "").replace(/\/+$/, "");
        if (baseUrl) {
          serviceUrl = `${baseUrl}/0`;
          layerQueryUrlRef.current = serviceUrl;
        }
      }

      let features: any[] = [];
      if (serviceUrl) {
        const params = new URLSearchParams({
          f: "json",
          where,
          outFields: "*",
          returnGeometry: "true",
          resultRecordCount: "2000",
        });
        if (apiKey) {
          params.set("token", apiKey);
        }
        const response = await fetch(`${serviceUrl}/query?${params.toString()}`);
        const payload = await response.json();
        if (payload?.error) {
          throw new Error(payload.error.message || "Feature query failed");
        }
        features = Array.isArray(payload?.features) ? payload.features : [];
      } else if (sourceLayer) {
        const featureSet = await sourceLayer.queryFeatures({
          where,
          outFields: ["*"],
          returnGeometry: true,
          num: 2000,
        });
        features = featureSet.features || [];
      }

      featureByIdRef.current.clear();
      const arcgisResults = features
        .map(mapFeatureToResult)
        .filter((item): item is ArcgisOrgResult => item !== null);

      const registrationResults = await loadRegistrationResults();
      renderRegistrationGraphics(registrationResults);

      const dedupe = new Set<string>();
      const nextResults: ArcgisOrgResult[] = [];
      [...arcgisResults, ...registrationResults].forEach((item) => {
        const key = `${item.name.toLowerCase()}|${item.address.toLowerCase()}`;
        if (dedupe.has(key)) {
          return;
        }
        dedupe.add(key);
        nextResults.push(item);
      });

      nextResults.forEach((item) => {
        if (item.source === "registration") {
          const regGraphic = registrationGraphicsRef.current.get(item.id);
          featureByIdRef.current.set(item.id, regGraphic || item.feature);
          return;
        }
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
    let searchWidget: any = null;
    let popupSelectedHandle: { remove: () => void } | null = null;

    ensureRuntimeConfig()
      .then(() => loadArcgisModules())
      .then(async ([esriConfig, ArcGISMap, FeatureLayer, Graphic, MapView, LayerList, Search]) => {
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

        const sourceLayer = new FeatureLayer({
          ...(layerUrl
            ? { url: layerUrl }
            : { portalItem: { id: DONOR_FEATURE_LAYER_ITEM_ID } }),
          outFields: ["*"],
          popupEnabled: true,
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
            fieldInfos: sourceLayer.fields
              .filter((f: any) => String(f?.name || "").toLowerCase() !== "shape")
              .map((f: any) => ({ fieldName: String(f.name), label: String(f.alias || f.name), visible: true }))
          }],
        };
        sourceLayerRef.current = sourceLayer;
        graphicCtorRef.current = Graphic;

        const map = new ArcGISMap({ basemap: "topo-vector", layers: [sourceLayer] });

        view = new MapView({
          container: mapContainerRef.current,
          map,
          popup: { dockEnabled: false, dockOptions: { breakpoint: false } },
        });

        mapViewRef.current = view;
        await view.when();

        try {
          view.ui.add(new LayerList({ view }), "top-left");
        } catch {
          // Ignore optional widget errors so core map/results still load.
        }

        try {
          searchWidget = new Search({
            view,
            includeDefaultSources: false,
            sources: [{
              layer: sourceLayer,
              searchFields: ["Company_Business_Name", "City", "ZIP_Code", "Mission_Area"],
              displayField: "Company_Business_Name",
              exactMatch: false,
              outFields: ["*"],
              name: "Organizations",
              placeholder: "Search by org, city, zip, or mission area",
            }],
          });
          view.ui.add(searchWidget, "top-right");
        } catch {
          // Ignore optional widget errors so core map/results still load.
        }

        popupSelectedHandle = view.watch("popup.selectedFeature", (feature: any) => {
          const nextId = String(feature?.attributes?.ObjectId ?? feature?.attributes?.OBJECTID ?? "");
          setSelectedOrgId(nextId || null);
          const fromPopup = mapFeatureToResult(feature, 0);
          if (fromPopup) {
            setDetailOrg(fromPopup);
          }
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
      searchWidget?.destroy?.();
      view?.destroy();
      mapViewRef.current = null;
      sourceLayerRef.current = null;
      graphicCtorRef.current = null;
      featureByIdRef.current.clear();
      registrationGraphicsRef.current.clear();
    };
  }, []);

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
            placeholder="Search by city, zip, org name, category..."
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
            onClick={() => setUrgentOnly((prev) => !prev)}
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

function OrganizationLiveMapPanel() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapViewRef = useRef<any>(null);
  const registrationGraphicsRef = useRef<Map<string, any>>(new Map());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [layerCount, setLayerCount] = useState(0);
  const [registrationCount, setRegistrationCount] = useState(0);
  const totalOrganizations = layerCount + registrationCount;

  useEffect(() => {
    if (!mapContainerRef.current || mapViewRef.current) {
      return;
    }

    let view: any = null;
    let clickHandle: { remove: () => void } | null = null;

    const loadRegistrations = async () => {
      const response = await fetch(REGISTRATIONS_ENDPOINT, { cache: "no-store" });
      if (!response.ok) {
        return [] as RegistrationRow[];
      }

      const payload = await response.json();
      return Array.isArray(payload?.registrations)
        ? payload.registrations.filter((row: any) => Number.isFinite(Number(row?.latitude)) && Number.isFinite(Number(row?.longitude)))
        : [];
    };

    const resolveLayerSymbol = (renderer: any, graphic: any) => {
      const fallbackSymbol = {
        type: "simple-marker",
        color: "#f4b942",
        size: 7,
        outline: {
          color: "#d9480f",
          width: 1.5,
        },
      };

      try {
        if (renderer?.getSymbol) {
          const symbolFromRenderer = renderer.getSymbol(graphic);
          if (symbolFromRenderer) {
            return symbolFromRenderer.clone ? symbolFromRenderer.clone() : symbolFromRenderer;
          }
        }
        if (renderer?.defaultSymbol) {
          return renderer.defaultSymbol.clone ? renderer.defaultSymbol.clone() : renderer.defaultSymbol;
        }
        if (renderer?.symbol) {
          return renderer.symbol.clone ? renderer.symbol.clone() : renderer.symbol;
        }
      } catch {
        // Fallback symbol is used if renderer lookup fails.
      }

      return fallbackSymbol;
    };

    setIsLoading(true);
    setError("");

    ensureRuntimeConfig()
      .then(() => loadArcgisModules())
      .then(async ([esriConfig, ArcGISMap, FeatureLayer, Graphic, MapView, LayerList, Search]) => {
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

        const sourceLayer = new FeatureLayer({
          ...(layerUrl
            ? { url: layerUrl }
            : { portalItem: { id: DONOR_FEATURE_LAYER_ITEM_ID } }),
          outFields: ["*"],
          popupEnabled: true,
        });

        await sourceLayer.load();
        sourceLayer.popupTemplate = {
          title: "{Company_Business_Name}",
          content: [{
            type: "fields",
            fieldInfos: sourceLayer.fields
              .filter((f: any) => String(f?.name || "").toLowerCase() !== "shape")
              .map((f: any) => ({ fieldName: String(f.name), label: String(f.alias || f.name), visible: true })),
          }],
        };

        const map = new ArcGISMap({ basemap: "topo-vector", layers: [sourceLayer] });
        view = new MapView({
          container: mapContainerRef.current,
          map,
          popup: { dockEnabled: false, dockOptions: { breakpoint: false } },
        });

        mapViewRef.current = view;
        await view.when();

        try {
          view.ui.add(new LayerList({ view }), "top-left");
          const searchWidget = new Search({
            view,
            includeDefaultSources: false,
            sources: [{
              layer: sourceLayer,
              searchFields: ["Company_Business_Name", "City", "ZIP_Code", "Mission_Area"],
              displayField: "Company_Business_Name",
              exactMatch: false,
              outFields: ["*"],
              name: "Organizations",
              placeholder: "Search organizations",
            }],
          });
          view.ui.add(searchWidget, "top-right");
        } catch {
          // Optional widgets may fail in constrained environments.
        }

        try {
          const registrations = await loadRegistrations();
          setRegistrationCount(registrations.length);
          registrationGraphicsRef.current.clear();

          if (registrations.length > 0) {
            const graphics = registrations.map((row) => {
              const graphic = new Graphic({
                geometry: {
                  type: "point",
                  latitude: Number(row.latitude),
                  longitude: Number(row.longitude),
                },
                attributes: {
                  ObjectId: row.id,
                  Company_Business_Name: row.organizationName,
                  City: row.city,
                  ZIP_Code: row.zip,
                  Mission_Area: row.missionArea,
                  Address__: row.address,
                  Organization_Description: row.description,
                  Need_Volunteers: row.needVolunteers ? "Yes" : "No",
                  Source: "Organization Registration",
                },
                popupTemplate: {
                  title: "{Company_Business_Name}",
                  content: [{
                    type: "fields",
                    fieldInfos: [
                      { fieldName: "Address__", label: "Address" },
                      { fieldName: "City", label: "City" },
                      { fieldName: "ZIP_Code", label: "ZIP" },
                      { fieldName: "Mission_Area", label: "Mission Area" },
                      { fieldName: "Need_Volunteers", label: "Volunteers" },
                      { fieldName: "Source", label: "Source" },
                    ],
                  }],
                },
              });

              graphic.symbol = resolveLayerSymbol(sourceLayer?.renderer, graphic);
              return graphic;
            });

            view.graphics.addMany(graphics);
            graphics.forEach((graphic: any) => {
              const id = String(graphic?.attributes?.ObjectId || "");
              if (id) {
                registrationGraphicsRef.current.set(id, graphic);
              }
            });
          }
        } catch {
          setRegistrationCount(0);
        }

        clickHandle = view.on("click", async (event: any) => {
          const hit = await view.hitTest(event);
          const hits = Array.isArray(hit?.results) ? hit.results : [];

          const registrationHit = hits.find((item: any) => {
            const id = String(item?.graphic?.attributes?.ObjectId || "");
            return id && registrationGraphicsRef.current.has(id);
          });

          if (registrationHit?.graphic) {
            view.popup.open({
              features: [registrationHit.graphic],
              location: event.mapPoint || registrationHit.graphic.geometry,
            });
            return;
          }

          const layerHit = hits.find((item: any) => item?.graphic?.layer === sourceLayer);
          if (layerHit?.graphic) {
            view.popup.open({
              features: [layerHit.graphic],
              location: event.mapPoint || layerHit.graphic.geometry,
            });
          }
        });

        const featureCount = await sourceLayer.queryFeatureCount({ where: "1=1" });
        setLayerCount(Number(featureCount) || 0);

        try {
          const extentResult = await sourceLayer.queryExtent({ where: "1=1" });
          if (extentResult?.extent) {
            await view.goTo(extentResult.extent.expand(1.1), { animate: false });
          }
        } catch {
          // Keep map usable if extent query fails.
        }

        setIsLoading(false);
      })
      .catch((err: any) => {
        const details = typeof err?.message === "string" ? ` (${err.message})` : "";
        setError(`Map unavailable${details}`);
        setIsLoading(false);
      });

    return () => {
      clickHandle?.remove();
      view?.destroy();
      mapViewRef.current = null;
      registrationGraphicsRef.current.clear();
    };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border shadow-md relative" style={{ minHeight: 360, borderColor: `${C.navy}10` }}>
      <div ref={mapContainerRef} className="absolute inset-0" />
      <div className="absolute left-3 top-3 z-20 rounded-xl bg-white/95 px-3 py-2 border shadow-sm" style={{ borderColor: `${C.navy}12` }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: C.rose }}>Live Layer</p>
        <p className="text-xs font-semibold" style={{ color: C.navy }}>Total organizations: {totalOrganizations}</p>
      </div>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
          <p className="text-sm font-semibold" style={{ color: `${C.navy}70` }}>Loading live map...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="absolute inset-x-3 bottom-3 z-20 rounded-xl px-3 py-2 border bg-white/95" style={{ borderColor: `${C.rose}35` }}>
          <p className="text-xs font-semibold" style={{ color: C.rose }}>{error}</p>
        </div>
      )}
    </div>
  );
}

function OrganizationMapShortlistPanel({ username, shortlistRecipients, onShortlistChange }: { username: string; shortlistRecipients: string[]; onShortlistChange: (items: string[]) => void }) {
  const [orgDirectory, setOrgDirectory] = useState<BroadcastOrgDirectoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZip, setFilterZip] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("25");

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const calculateMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const earthMiles = 3958.8;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthMiles * c;
  };

  const inferCategories = (missionArea: string) => {
    const text = String(missionArea || "").toLowerCase();
    const matches = SECTOR_FILTERS.filter((sector) => text.includes(sector.value)).map((sector) => sector.label);
    return matches.length > 0 ? matches : ["General"];
  };

  const loadDirectory = async () => {
    setLoading(true);
    setError("");

    const normalizeName = (value: unknown) => String(value || "").trim().toLowerCase();

    const loadMapOrganizations = async (): Promise<BroadcastOrgDirectoryItem[]> => {
      try {
        await ensureRuntimeConfig();
        const apiKey = window.__APP_CONFIG?.arcgisApiKey || "";

        const itemParams = new URLSearchParams({ f: "json" });
        if (apiKey) {
          itemParams.set("token", apiKey);
        }

        const itemResponse = await fetch(
          `https://www.arcgis.com/sharing/rest/content/items/${DONOR_FEATURE_LAYER_ITEM_ID}?${itemParams.toString()}`
        );
        const itemPayload = await itemResponse.json();
        const baseUrl = String(itemPayload?.url || "").replace(/\/+$/, "");
        if (!baseUrl) {
          return [];
        }

        const queryParams = new URLSearchParams({
          f: "json",
          where: "1=1",
          outFields: "Company_Business_Name,City,ZIP_Code,Mission_Area,Esri_Category_Description",
          returnGeometry: "true",
          outSR: "4326",
          resultRecordCount: "2000",
        });
        if (apiKey) {
          queryParams.set("token", apiKey);
        }

        const queryResponse = await fetch(`${baseUrl}/0/query?${queryParams.toString()}`);
        const queryPayload = await queryResponse.json();
        const features = Array.isArray(queryPayload?.features) ? queryPayload.features : [];

        return features
          .map((feature: any) => {
            const attrs = feature?.attributes || {};
            const name = String(attrs.Company_Business_Name || "").trim();
            if (!name) return null;

            return {
              name,
              city: String(attrs.City || "").trim(),
              zip: String(attrs.ZIP_Code || "").trim(),
              missionArea: String(attrs.Mission_Area || attrs.Esri_Category_Description || "").trim(),
              latitude: Number.isFinite(Number(feature?.geometry?.y)) ? Number(feature.geometry.y) : null,
              longitude: Number.isFinite(Number(feature?.geometry?.x)) ? Number(feature.geometry.x) : null,
              categories: inferCategories(String(attrs.Mission_Area || attrs.Esri_Category_Description || "")),
              source: "map" as const,
            };
          })
          .filter((item: BroadcastOrgDirectoryItem | null): item is BroadcastOrgDirectoryItem => item !== null);
      } catch {
        return [];
      }
    };

    const loadRegistrationOrganizations = async (): Promise<BroadcastOrgDirectoryItem[]> => {
      try {
        const response = await fetch(REGISTRATIONS_ENDPOINT, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          return [];
        }

        const rows = Array.isArray(payload?.registrations) ? payload.registrations : [];
        return rows
          .map((row: any) => {
            const name = String(row.organizationName || "").trim();
            if (!name) return null;

            return {
              name,
              city: String(row.city || "").trim(),
              zip: String(row.zip || "").trim(),
              missionArea: String(row.missionArea || row.esriCategoryDescription || "").trim(),
              latitude: Number.isFinite(Number(row.latitude)) ? Number(row.latitude) : null,
              longitude: Number.isFinite(Number(row.longitude)) ? Number(row.longitude) : null,
              categories: inferCategories(String(row.missionArea || row.esriCategoryDescription || "")),
              source: "registration" as const,
            };
          })
          .filter((item: BroadcastOrgDirectoryItem | null): item is BroadcastOrgDirectoryItem => item !== null);
      } catch {
        return [];
      }
    };

    try {
      const [mapOrgs, regOrgs] = await Promise.all([loadMapOrganizations(), loadRegistrationOrganizations()]);
      const byName = new Map<string, BroadcastOrgDirectoryItem>();

      [...mapOrgs, ...regOrgs].forEach((item) => {
        const key = normalizeName(item.name);
        if (!key || key === normalizeName(username)) {
          return;
        }

        const existing = byName.get(key);
        if (!existing) {
          byName.set(key, item);
          return;
        }

        if (existing.source === "map" && item.source === "registration") {
          byName.set(key, item);
          return;
        }

        if (!existing.city && item.city) existing.city = item.city;
        if (!existing.zip && item.zip) existing.zip = item.zip;
        if (!existing.missionArea && item.missionArea) existing.missionArea = item.missionArea;
        if ((existing.latitude === null || existing.longitude === null) && item.latitude !== null && item.longitude !== null) {
          existing.latitude = item.latitude;
          existing.longitude = item.longitude;
        }
        if ((existing.categories || []).length <= 1 && item.categories.length > 1) {
          existing.categories = item.categories;
        }
      });

      setOrgDirectory(Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      setError("Could not load organizations for map shortlisting.");
      setOrgDirectory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDirectory();
  }, []);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    orgDirectory.forEach((org) => org.categories.forEach((c) => set.add(c)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [orgDirectory]);

  const zipCenter = useMemo(() => {
    const zip = filterZip.trim();
    if (!zip) return null;

    const points = orgDirectory.filter((org) =>
      String(org.zip || "").startsWith(zip) &&
      org.latitude !== null &&
      org.longitude !== null
    );

    if (points.length === 0) return null;

    const total = points.reduce(
      (acc, org) => ({
        lat: acc.lat + Number(org.latitude),
        lon: acc.lon + Number(org.longitude),
      }),
      { lat: 0, lon: 0 }
    );

    return {
      latitude: total.lat / points.length,
      longitude: total.lon / points.length,
    };
  }, [orgDirectory, filterZip]);

  const filteredDirectory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const zip = filterZip.trim();
    const category = filterCategory.trim().toLowerCase();
    const radius = Number(radiusMiles);

    return orgDirectory
      .map((org) => {
        let distanceMiles: number | null = null;
        if (zipCenter && org.latitude !== null && org.longitude !== null) {
          distanceMiles = calculateMiles(zipCenter.latitude, zipCenter.longitude, org.latitude, org.longitude);
        }
        return { ...org, distanceMiles };
      })
      .filter((org) => {
        if (term) {
          const haystack = `${org.name} ${org.city} ${org.zip} ${org.missionArea}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }

        if (category) {
          const has = org.categories.some((item) => item.toLowerCase().includes(category));
          if (!has) return false;
        }

        if (zip) {
          const sameZip = String(org.zip || "").startsWith(zip);
          if (!sameZip && zipCenter === null) return false;

          if (zipCenter && Number.isFinite(radius) && radius > 0) {
            if (org.distanceMiles === null || org.distanceMiles > radius) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (a.distanceMiles === null && b.distanceMiles === null) return a.name.localeCompare(b.name);
        if (a.distanceMiles === null) return 1;
        if (b.distanceMiles === null) return -1;
        return a.distanceMiles - b.distanceMiles;
      });
  }, [orgDirectory, searchTerm, filterZip, filterCategory, radiusMiles, zipCenter]);

  const toggleShortlist = (orgName: string) => {
    if (shortlistRecipients.includes(orgName)) {
      onShortlistChange(shortlistRecipients.filter((item) => item !== orgName));
      return;
    }
    onShortlistChange(Array.from(new Set([...shortlistRecipients, orgName])));
  };

  const addAllFiltered = () => {
    onShortlistChange(Array.from(new Set([...shortlistRecipients, ...filteredDirectory.map((org) => org.name)])));
  };

  return (
    <div className="mt-4 rounded-2xl border bg-white/92 p-4" style={{ borderColor: `${C.navy}10` }}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: C.rose }}>Map Viewer Filters</p>
          <h3 className="text-base font-extrabold" style={{ color: C.navy }}>Build Broadcast Shortlist</h3>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: `${C.blue}14`, color: C.blue }}>
          Shortlist: {shortlistRecipients.length}
        </span>
      </div>

      <p className="text-xs mt-1" style={{ color: `${C.navy}58` }}>
        Enter a ZIP code to find nearby organizations within miles, then add them to shortlist for Broadcast.
      </p>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search name / city" className="rounded-xl border bg-white px-3 py-2 text-xs outline-none md:col-span-2" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
        <input type="text" value={filterZip} onChange={(e) => setFilterZip(e.target.value)} placeholder="ZIP code" className="rounded-xl border bg-white px-3 py-2 text-xs outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-xl border bg-white px-3 py-2 text-xs outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }}>
          <option value="">All categories</option>
          {availableCategories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <input type="number" min="1" max="250" value={radiusMiles} onChange={(e) => setRadiusMiles(e.target.value)} placeholder="Miles" className="rounded-xl border bg-white px-3 py-2 text-xs outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={addAllFiltered} className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: C.blue }}>
          Add all filtered
        </button>
        <button type="button" onClick={() => onShortlistChange([])} className="rounded-lg px-3 py-1.5 text-[11px] font-bold border" style={{ borderColor: `${C.navy}16`, color: C.navy }}>
          Clear shortlist
        </button>
        <button type="button" onClick={() => void loadDirectory()} className="rounded-lg px-3 py-1.5 text-[11px] font-bold border" style={{ borderColor: `${C.navy}16`, color: C.navy }}>
          {loading ? "Refreshing..." : "Refresh organizations"}
        </button>
        {filterZip && !zipCenter ? (
          <span className="text-[11px]" style={{ color: C.rose }}>No coordinate anchor found for this ZIP yet. Showing ZIP matches only.</span>
        ) : null}
      </div>

      {error ? <p className="text-xs font-semibold mt-2" style={{ color: C.rose }}>{error}</p> : null}

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-xs" style={{ color: `${C.navy}55` }}>Loading organizations...</p>
        ) : filteredDirectory.length === 0 ? (
          <p className="text-xs" style={{ color: `${C.navy}55` }}>No organizations match these filters.</p>
        ) : (
          filteredDirectory.slice(0, 180).map((org) => (
            <label key={org.name} className="flex items-start gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: `${C.navy}10`, color: C.navy }}>
              <input type="checkbox" checked={shortlistRecipients.includes(org.name)} onChange={() => toggleShortlist(org.name)} />
              <div>
                <p className="text-sm font-semibold leading-tight">{org.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: `${C.navy}58` }}>
                  {org.city || "City n/a"} · {org.zip || "ZIP n/a"} · {org.categories.join(", ")}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: `${C.navy}58` }}>
                  {org.missionArea || "Mission n/a"}
                  {org.distanceMiles !== null ? ` · ${org.distanceMiles.toFixed(1)} mi` : ""}
                </p>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
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
function OrgDashboard({ username, onSignOut, onOpenRegistration, onOpenShifts, onOpenBroadcasts, shortlistRecipients, onShortlistChange }: { username: string; onSignOut: () => void; onOpenRegistration: () => void; onOpenShifts: () => void; onOpenBroadcasts: () => void; shortlistRecipients: string[]; onShortlistChange: (items: string[]) => void }) {
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
                <button
                  type="button"
                  onClick={onOpenRegistration}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b transition-colors text-left hover:opacity-80"
                  style={{ borderColor: `${C.navy}06` }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${C.blue}18` }}>
                    <MapPinIcon size={16} style={{ color: C.blue }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: C.navy }}>Register New Organization</p>
                    <p className="text-xs" style={{ color: `${C.navy}50` }}>Add an organization record stored in project CSV</p>
                  </div>
                  <ChevronRight size={14} style={{ color: `${C.navy}30` }} />
                </button>
                {[
                  { label: "Update needs list",       sub: "Tell donors what you need most",    icon: CheckCircle2, color: C.green, onClick: onOpenRegistration },
                  { label: "Schedule volunteer shift", sub: "Open a new slot for sign-ups",      icon: Users,        color: C.rose, onClick: onOpenShifts },
                  { label: "Broadcast to nearby orgs",  sub: "Send an alert to partner nonprofits", icon: Heart,       color: C.blue, onClick: onOpenBroadcasts  },
                ].map((action) => (
                  <button key={action.label} onClick={action.onClick} className="w-full flex items-center gap-3 px-4 py-3.5 border-b last:border-0 transition-colors text-left hover:opacity-80"
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
                <h2 className="text-xl font-extrabold" style={{ color: C.navy }}>Live Organizations Map</h2>
              </div>
              <OrganizationLiveMapPanel />
              <OrganizationMapShortlistPanel
                username={username}
                shortlistRecipients={shortlistRecipients}
                onShortlistChange={onShortlistChange}
              />
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

function OrganizationRegistrationScreen({ onBack, onSaved, username }: { onBack: () => void; onSaved: () => void; username: string }) {
  const emptyForm = {
    id: "",
    organizationName: username || "",
    address: "",
    city: "",
    stateAbbreviation: "",
    zip: "",
    industryDescription: "",
    employeeCount: "",
    esriCategoryDescription: "",
    missionArea: "",
    mainContact: "",
    contactEmail: "",
    websiteLink: "",
    workingHours: "",
    matchedAddress: "",
    needVolunteers: false,
    latitude: "",
    longitude: "",
    description: "",
    foodYN: false,
    foodText: "",
    clothesYN: false,
    clothesText: "",
    shelterYN: false,
    shelterText: "",
    beddingYN: false,
    beddingText: "",
    toiletriesYN: false,
    toiletriesText: "",
    furnitureYN: false,
    furnitureText: "",
    medicalSuppliesYN: false,
    medicalSuppliesText: "",
    electronicsYN: false,
    electronicsText: "",
    educationMaterialsYN: false,
    educationMaterialsText: "",
    babyItemsYN: false,
    babyItemsText: "",
    cleaningItemsYN: false,
    cleaningItemsText: "",
  };

  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const loadRegistrations = async () => {
    setLoadingExisting(true);
    try {
      const response = await fetch(REGISTRATIONS_ENDPOINT, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(String(payload?.message || "Could not load existing registrations"));
      }
      const rows: RegistrationRow[] = Array.isArray(payload?.registrations) ? payload.registrations : [];
      setRegistrations(rows);
      if (!selectedRegistrationId && username) {
        const match = rows.find((row) => String(row.organizationName || "").toLowerCase() === String(username).toLowerCase());
        if (match) {
          setSelectedRegistrationId(match.id);
          fillFormFromRow(match);
        }
      }
    } catch (err: any) {
      setError(String(err?.message || "Could not load existing registrations"));
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    void loadRegistrations();
  }, []);

  const toBool = (value: unknown) => String(value || "").toLowerCase() === "yes" || String(value || "").toLowerCase() === "true";

  const fillFormFromRow = (row: RegistrationRow) => {
    setForm({
      id: row.id || "",
      organizationName: row.organizationName || "",
      address: row.address || "",
      city: row.city || "",
      stateAbbreviation: row.stateAbbreviation || "",
      zip: row.zip || "",
      industryDescription: row.industryDescription || "",
      employeeCount: row.employeeCount || "",
      esriCategoryDescription: row.esriCategoryDescription || "",
      missionArea: row.missionArea || "",
      mainContact: row.mainContact || "",
      contactEmail: row.contactEmail || "",
      websiteLink: row.websiteLink || "",
      workingHours: row.workingHours || "",
      matchedAddress: row.matchedAddress || "",
      needVolunteers: Boolean(row.needVolunteers),
      latitude: row.latitude !== undefined && row.latitude !== null ? String(row.latitude) : "",
      longitude: row.longitude !== undefined && row.longitude !== null ? String(row.longitude) : "",
      description: row.description || "",
      foodYN: toBool(row.foodYN),
      foodText: row.foodText || "",
      clothesYN: toBool(row.clothesYN),
      clothesText: row.clothesText || "",
      shelterYN: toBool(row.shelterYN),
      shelterText: row.shelterText || "",
      beddingYN: toBool(row.beddingYN),
      beddingText: row.beddingText || "",
      toiletriesYN: toBool(row.toiletriesYN),
      toiletriesText: row.toiletriesText || "",
      furnitureYN: toBool(row.furnitureYN),
      furnitureText: row.furnitureText || "",
      medicalSuppliesYN: toBool(row.medicalSuppliesYN),
      medicalSuppliesText: row.medicalSuppliesText || "",
      electronicsYN: toBool(row.electronicsYN),
      electronicsText: row.electronicsText || "",
      educationMaterialsYN: toBool(row.educationMaterialsYN),
      educationMaterialsText: row.educationMaterialsText || "",
      babyItemsYN: toBool(row.babyItemsYN),
      babyItemsText: row.babyItemsText || "",
      cleaningItemsYN: toBool(row.cleaningItemsYN),
      cleaningItemsText: row.cleaningItemsText || "",
    });
  };

  const update = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const payload = {
        organizationName: form.organizationName,
        address: form.address,
        city: form.city,
        stateAbbreviation: form.stateAbbreviation,
        zip: form.zip,
        industryDescription: form.industryDescription,
        employeeCount: form.employeeCount,
        esriCategoryDescription: form.esriCategoryDescription,
        missionArea: form.missionArea,
        mainContact: form.mainContact,
        contactEmail: form.contactEmail,
        websiteLink: form.websiteLink,
        workingHours: form.workingHours,
        matchedAddress: form.matchedAddress,
        needVolunteers: form.needVolunteers,
        latitude: form.latitude.trim() ? Number(form.latitude) : undefined,
        longitude: form.longitude.trim() ? Number(form.longitude) : undefined,
        description: form.description,
        foodYN: form.foodYN,
        foodText: form.foodText,
        clothesYN: form.clothesYN,
        clothesText: form.clothesText,
        shelterYN: form.shelterYN,
        shelterText: form.shelterText,
        beddingYN: form.beddingYN,
        beddingText: form.beddingText,
        toiletriesYN: form.toiletriesYN,
        toiletriesText: form.toiletriesText,
        furnitureYN: form.furnitureYN,
        furnitureText: form.furnitureText,
        medicalSuppliesYN: form.medicalSuppliesYN,
        medicalSuppliesText: form.medicalSuppliesText,
        electronicsYN: form.electronicsYN,
        electronicsText: form.electronicsText,
        educationMaterialsYN: form.educationMaterialsYN,
        educationMaterialsText: form.educationMaterialsText,
        babyItemsYN: form.babyItemsYN,
        babyItemsText: form.babyItemsText,
        cleaningItemsYN: form.cleaningItemsYN,
        cleaningItemsText: form.cleaningItemsText,
      };

      const isUpdate = Boolean(selectedRegistrationId);
      const endpoint = isUpdate ? `${REGISTRATIONS_ENDPOINT}/${selectedRegistrationId}` : REGISTRATIONS_ENDPOINT;
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(String(data?.message || "Could not save registration"));
      }

      setSuccess(isUpdate ? "Organization information updated." : "Organization registration saved.");
      await loadRegistrations();

      if (!isUpdate) {
        setForm({ ...emptyForm, organizationName: form.organizationName || username || "" });
      }

      setTimeout(() => {
        onSaved();
      }, 700);
    } catch (err: any) {
      setError(String(err?.message || "Could not save registration"));
    } finally {
      setSubmitting(false);
    }
  };

  const needFields = [
    { key: "food", label: "Food" },
    { key: "clothes", label: "Clothes" },
    { key: "shelter", label: "Shelter" },
    { key: "bedding", label: "Bedding" },
    { key: "toiletries", label: "Toiletries" },
    { key: "furniture", label: "Furniture" },
    { key: "medicalSupplies", label: "Medical Supplies" },
    { key: "electronics", label: "Electronics" },
    { key: "educationMaterials", label: "Education Materials" },
    { key: "babyItems", label: "Baby Items" },
    { key: "cleaningItems", label: "Cleaning Items" },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div key="org-register" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.45 }} className="flex flex-col items-center gap-4 px-6 py-8 w-full">
        <div className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm rounded-3xl px-8 py-7 shadow-lg border w-full max-w-4xl" style={{ borderColor: `${C.navy}08` }}>
          <div className="w-full flex justify-start -ml-2 mb-1"><BackButton onClick={onBack} /></div>
          <h2 className="text-3xl font-extrabold mt-1" style={{ color: C.navy }}>Organization Profile</h2>
          <p className="text-sm text-center max-w-2xl" style={{ color: `${C.navy}60` }}>Create a new profile or load an existing one and update your organization information.</p>

          <div className="w-full mt-4 rounded-2xl border bg-white/85 px-4 py-3" style={{ borderColor: `${C.navy}14` }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-1" style={{ color: `${C.navy}45` }}>Existing Registrations</p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
              <select
                value={selectedRegistrationId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedRegistrationId(id);
                  if (!id) {
                    setForm({ ...emptyForm, organizationName: username || "" });
                    return;
                  }
                  const found = registrations.find((row) => row.id === id);
                  if (found) {
                    fillFormFromRow(found);
                  }
                }}
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                style={{ borderColor: `${C.navy}16`, color: C.navy }}
              >
                <option value="">Create new organization profile</option>
                {registrations.map((row) => (
                  <option key={row.id} value={row.id}>{row.organizationName || row.id}</option>
                ))}
              </select>
              <button type="button" onClick={() => setForm({ ...emptyForm, organizationName: username || "" })} className="rounded-xl border px-3 py-2 text-xs font-bold" style={{ borderColor: `${C.navy}18`, color: C.navy }}>Reset Form</button>
              <button type="button" onClick={() => void loadRegistrations()} className="rounded-xl border px-3 py-2 text-xs font-bold" style={{ borderColor: `${C.navy}18`, color: C.navy }}>{loadingExisting ? "Refreshing..." : "Refresh"}</button>
            </div>
          </div>

          <form className="flex flex-col gap-4 w-full mt-4" onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" value={form.organizationName} onChange={(e) => update("organizationName", e.target.value)} placeholder="Organization name" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.mainContact} onChange={(e) => update("mainContact", e.target.value)} placeholder="Main contact" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="Contact email" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.websiteLink} onChange={(e) => update("websiteLink", e.target.value)} placeholder="Website" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Address" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none md:col-span-2" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={form.stateAbbreviation} onChange={(e) => update("stateAbbreviation", e.target.value)} placeholder="State" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
                <input type="text" value={form.zip} onChange={(e) => update("zip", e.target.value)} placeholder="ZIP" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              </div>
              <input type="text" value={form.missionArea} onChange={(e) => update("missionArea", e.target.value)} placeholder="Mission area" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.esriCategoryDescription} onChange={(e) => update("esriCategoryDescription", e.target.value)} placeholder="Esri category description" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.industryDescription} onChange={(e) => update("industryDescription", e.target.value)} placeholder="Industry description" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.employeeCount} onChange={(e) => update("employeeCount", e.target.value)} placeholder="Employee count" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.workingHours} onChange={(e) => update("workingHours", e.target.value)} placeholder="Working hours" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.matchedAddress} onChange={(e) => update("matchedAddress", e.target.value)} placeholder="Matched address" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <div className="grid grid-cols-2 gap-3 md:col-span-2">
                <input type="text" value={form.latitude} onChange={(e) => update("latitude", e.target.value)} placeholder="Latitude (optional)" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
                <input type="text" value={form.longitude} onChange={(e) => update("longitude", e.target.value)} placeholder="Longitude (optional)" className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              </div>
            </div>

            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Organization description" rows={3} className="w-full rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />

            <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.navy }}>
              <input type="checkbox" checked={form.needVolunteers} onChange={(e) => update("needVolunteers", e.target.checked)} /> Volunteers needed
            </label>

            <div className="rounded-2xl border bg-white/80 px-4 py-4" style={{ borderColor: `${C.navy}14` }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: `${C.navy}45` }}>Donation Needs</p>
              <div className="space-y-3">
                {needFields.map((need) => {
                  const ynKey = `${need.key}YN`;
                  const textKey = `${need.key}Text`;
                  return (
                    <div key={need.key} className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 items-center">
                      <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.navy }}>
                        <input type="checkbox" checked={Boolean((form as any)[ynKey])} onChange={(e) => update(ynKey, e.target.checked)} /> {need.label}
                      </label>
                      <input type="text" value={String((form as any)[textKey] || "")} onChange={(e) => update(textKey, e.target.value)} placeholder={`${need.label} details`} className="w-full rounded-xl border bg-white/90 px-4 py-2.5 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
                    </div>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-xs font-semibold" style={{ color: C.rose }}>{error}</p>}
            {success && <p className="text-xs font-semibold" style={{ color: C.green }}>{success}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="submit" disabled={submitting} className="w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-60" style={{ background: C.blue }}>
                {submitting ? "Saving..." : selectedRegistrationId ? "Update Information" : "Save Registration"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setSelectedRegistrationId("");
                  setForm({ ...emptyForm, organizationName: username || "" });
                  setSuccess("");
                  setError("");
                }}
                className="w-full py-4 rounded-xl border font-bold text-base transition-colors"
                style={{ borderColor: `${C.navy}18`, color: C.navy, background: "rgba(255,255,255,0.9)" }}
              >
                New Profile
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function OrganizationShiftScreen({ onBack, username }: { onBack: () => void; username: string }) {
  const [shifts, setShifts] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    organizationName: username || "",
    roleTitle: "",
    shiftDate: "",
    startTime: "",
    endTime: "",
    volunteersNeeded: "1",
    location: "",
    notes: "",
    contactName: "",
    contactEmail: "",
  });

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadShifts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(VOLUNTEER_SHIFTS_ENDPOINT, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(String(payload?.message || "Could not load shifts"));
      }

      const rows = Array.isArray(payload?.shifts) ? payload.shifts : [];
      const mine = rows
        .filter((row: any) => String(row.organizationName || "").toLowerCase() === String(form.organizationName || username).toLowerCase())
        .sort((a: any, b: any) => String(b.shiftDate).localeCompare(String(a.shiftDate)));
      setShifts(mine);
    } catch (err: any) {
      setError(String(err?.message || "Could not load shifts"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadShifts();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        organizationName: form.organizationName,
        roleTitle: form.roleTitle,
        shiftDate: form.shiftDate,
        startTime: form.startTime,
        endTime: form.endTime,
        volunteersNeeded: Number(form.volunteersNeeded),
        location: form.location,
        notes: form.notes,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
      };

      const response = await fetch(VOLUNTEER_SHIFTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(String(data?.message || "Could not create shift"));
      }

      setSuccess("Volunteer shift scheduled.");
      setForm((prev) => ({
        ...prev,
        roleTitle: "",
        shiftDate: "",
        startTime: "",
        endTime: "",
        volunteersNeeded: "1",
        location: "",
        notes: "",
        contactName: "",
        contactEmail: "",
      }));
      await loadShifts();
    } catch (err: any) {
      setError(String(err?.message || "Could not create shift"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div key="org-shifts" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.45 }} className="flex flex-col items-center gap-4 px-6 py-8 w-full">
        <div className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm rounded-3xl px-8 py-7 shadow-lg border w-full max-w-4xl" style={{ borderColor: `${C.navy}08` }}>
          <div className="w-full flex justify-start -ml-2 mb-1"><BackButton onClick={onBack} /></div>
          <h2 className="text-3xl font-extrabold mt-1" style={{ color: C.navy }}>Schedule Volunteer Shift</h2>
          <p className="text-sm text-center max-w-2xl" style={{ color: `${C.navy}60` }}>Create shifts and track upcoming volunteer coverage for your organization.</p>

          <form className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submit}>
            <input type="text" value={form.organizationName} onChange={(e) => update("organizationName", e.target.value)} placeholder="Organization" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none md:col-span-2" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
            <input type="text" value={form.roleTitle} onChange={(e) => update("roleTitle", e.target.value)} placeholder="Role title (e.g., Pantry Intake Volunteer)" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none md:col-span-2" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
            <input type="date" value={form.shiftDate} onChange={(e) => update("shiftDate", e.target.value)} className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
            <input type="number" min="1" max="500" value={form.volunteersNeeded} onChange={(e) => update("volunteersNeeded", e.target.value)} placeholder="Volunteers needed" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
            <input type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
            <input type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
            <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Shift location" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none md:col-span-2" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
            <input type="text" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} placeholder="Contact name" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
            <input type="text" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="Contact email" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Notes" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none md:col-span-2" style={{ color: C.navy, borderColor: `${C.navy}15` }} />

            {error ? <p className="text-xs font-semibold md:col-span-2" style={{ color: C.rose }}>{error}</p> : null}
            {success ? <p className="text-xs font-semibold md:col-span-2" style={{ color: C.green }}>{success}</p> : null}

            <button type="submit" disabled={submitting} className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.blue }}>
              {submitting ? "Saving..." : "Create Shift"}
            </button>
            <button type="button" onClick={() => void loadShifts()} className="rounded-xl py-3 text-sm font-bold border" style={{ borderColor: `${C.navy}18`, color: C.navy }}>
              {loading ? "Refreshing..." : "Refresh Shifts"}
            </button>
          </form>

          <div className="w-full mt-5 rounded-2xl border bg-white/85" style={{ borderColor: `${C.navy}12` }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: `${C.navy}08` }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: C.rose }}>Upcoming</p>
              <h3 className="text-sm font-extrabold" style={{ color: C.navy }}>Scheduled Shifts</h3>
            </div>
            {loading ? (
              <p className="px-4 py-4 text-xs" style={{ color: `${C.navy}55` }}>Loading shifts...</p>
            ) : shifts.length === 0 ? (
              <p className="px-4 py-4 text-xs" style={{ color: `${C.navy}55` }}>No shifts scheduled yet.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: `${C.navy}08` }}>
                {shifts.map((shift) => (
                  <div key={String(shift.id)} className="px-4 py-3">
                    <p className="text-sm font-bold" style={{ color: C.navy }}>{String(shift.roleTitle || "Volunteer Shift")}</p>
                    <p className="text-xs mt-1" style={{ color: `${C.navy}65` }}>
                      {String(shift.shiftDate || "")} · {String(shift.startTime || "")} - {String(shift.endTime || "")}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: `${C.navy}65` }}>
                      {String(shift.location || "")} · Needed: {String(shift.volunteersNeeded || "0")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

type BroadcastInboxItem = {
  id: string;
  broadcastId: string;
  senderOrganization: string;
  recipientOrganization: string;
  title: string;
  category: string;
  urgency: string;
  location: string;
  startDate: string;
  endDate: string;
  message: string;
  contactName: string;
  contactEmail: string;
  responseStatus: "pending" | "can-help" | "cannot-help" | "need-details";
  responseNote: string;
  respondedAt: string;
  createdAt: string;
  updatedAt: string;
};

type BroadcastSentItem = {
  broadcastId: string;
  title: string;
  category: string;
  urgency: string;
  location: string;
  startDate: string;
  endDate: string;
  message: string;
  createdAt: string;
  counts: {
    total: number;
    pending: number;
    canHelp: number;
    cannotHelp: number;
    needDetails: number;
  };
  recipients: Array<{
    id: string;
    recipientOrganization: string;
    responseStatus: string;
    responseNote: string;
    respondedAt: string;
  }>;
};

type BroadcastOrgDirectoryItem = {
  name: string;
  city: string;
  zip: string;
  missionArea: string;
  latitude: number | null;
  longitude: number | null;
  categories: string[];
  source: "map" | "registration";
};

function OrganizationBroadcastScreen({ onBack, username, shortlistRecipients, onShortlistChange }: { onBack: () => void; username: string; shortlistRecipients: string[]; onShortlistChange: (items: string[]) => void }) {
  const [view, setView] = useState<"compose" | "inbox" | "sent">("compose");
  const [orgOptions, setOrgOptions] = useState<string[]>([]);
  const [orgDirectory, setOrgDirectory] = useState<BroadcastOrgDirectoryItem[]>([]);
  const selectedRecipients = shortlistRecipients;
  const setSelectedRecipients = onShortlistChange;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZip, setFilterZip] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("25");
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [inbox, setInbox] = useState<BroadcastInboxItem[]>([]);
  const [sent, setSent] = useState<BroadcastSentItem[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    senderOrganization: username || "",
    title: "",
    category: "Need Volunteers",
    urgency: "Normal",
    location: "",
    startDate: "",
    endDate: "",
    message: "",
    contactName: "",
    contactEmail: "",
    recipientMode: "all" as "all" | "selected",
  });

  const categories = ["Need Volunteers", "Need Supplies", "Offering Supplies", "Event Support"];
  const urgencies = ["Low", "Normal", "High", "Critical"];

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const calculateMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const earthMiles = 3958.8;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthMiles * c;
  };

  const inferCategories = (missionArea: string) => {
    const text = String(missionArea || "").toLowerCase();
    const matches = SECTOR_FILTERS.filter((sector) => text.includes(sector.value)).map((sector) => sector.label);
    if (matches.length > 0) {
      return matches;
    }
    return ["General"];
  };

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadOrgOptions = async () => {
    const normalizeName = (value: unknown) => String(value || "").trim().toLowerCase();

    const loadMapOrganizations = async (): Promise<BroadcastOrgDirectoryItem[]> => {
      try {
        await ensureRuntimeConfig();
        const apiKey = window.__APP_CONFIG?.arcgisApiKey || "";

        const itemParams = new URLSearchParams({ f: "json" });
        if (apiKey) {
          itemParams.set("token", apiKey);
        }

        const itemResponse = await fetch(
          `https://www.arcgis.com/sharing/rest/content/items/${DONOR_FEATURE_LAYER_ITEM_ID}?${itemParams.toString()}`
        );
        const itemPayload = await itemResponse.json();
        const baseUrl = String(itemPayload?.url || "").replace(/\/+$/, "");
        if (!baseUrl) {
          return [];
        }

        const queryParams = new URLSearchParams({
          f: "json",
          where: "1=1",
          outFields: "Company_Business_Name,City,ZIP_Code,Mission_Area,Esri_Category_Description",
          returnGeometry: "true",
          outSR: "4326",
          resultRecordCount: "2000",
        });
        if (apiKey) {
          queryParams.set("token", apiKey);
        }

        const queryResponse = await fetch(`${baseUrl}/0/query?${queryParams.toString()}`);
        const queryPayload = await queryResponse.json();
        const features = Array.isArray(queryPayload?.features) ? queryPayload.features : [];

        return features
          .map((feature: any) => {
            const attrs = feature?.attributes || {};
            const name = String(attrs.Company_Business_Name || "").trim();
            if (!name) {
              return null;
            }
            return {
              name,
              city: String(attrs.City || "").trim(),
              zip: String(attrs.ZIP_Code || "").trim(),
              missionArea: String(attrs.Mission_Area || attrs.Esri_Category_Description || "").trim(),
              latitude: Number.isFinite(Number(feature?.geometry?.y)) ? Number(feature.geometry.y) : null,
              longitude: Number.isFinite(Number(feature?.geometry?.x)) ? Number(feature.geometry.x) : null,
              categories: inferCategories(String(attrs.Mission_Area || attrs.Esri_Category_Description || "")),
              source: "map" as const,
            };
          })
          .filter((item: BroadcastOrgDirectoryItem | null): item is BroadcastOrgDirectoryItem => item !== null);
      } catch {
        return [];
      }
    };

    const loadRegistrationOrganizations = async (): Promise<{ orgs: BroadcastOrgDirectoryItem[]; myOrgLocation: { latitude: number; longitude: number } | null }> => {
      try {
        const response = await fetch(REGISTRATIONS_ENDPOINT, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          return { orgs: [], myOrgLocation: null };
        }

        const rows = Array.isArray(payload?.registrations) ? payload.registrations : [];
        const myMatch = rows.find((row: any) => String(row.organizationName || "").trim().toLowerCase() === String(username || "").trim().toLowerCase());
        const myLat = Number(myMatch?.latitude);
        const myLon = Number(myMatch?.longitude);
        const myOrgLocation = Number.isFinite(myLat) && Number.isFinite(myLon)
          ? { latitude: myLat, longitude: myLon }
          : null;

        const orgs = rows
          .map((row: any) => {
            const name = String(row.organizationName || "").trim();
            if (!name) {
              return null;
            }
            return {
              name,
              city: String(row.city || "").trim(),
              zip: String(row.zip || "").trim(),
              missionArea: String(row.missionArea || row.esriCategoryDescription || "").trim(),
              latitude: Number.isFinite(Number(row.latitude)) ? Number(row.latitude) : null,
              longitude: Number.isFinite(Number(row.longitude)) ? Number(row.longitude) : null,
              categories: inferCategories(String(row.missionArea || row.esriCategoryDescription || "")),
              source: "registration" as const,
            };
          })
          .filter((item: BroadcastOrgDirectoryItem | null): item is BroadcastOrgDirectoryItem => item !== null);

        return { orgs, myOrgLocation };
      } catch {
        return { orgs: [], myOrgLocation: null };
      }
    };

    try {
      const [mapOrgs, regResult] = await Promise.all([loadMapOrganizations(), loadRegistrationOrganizations()]);
      const regOrgs = regResult.orgs;
      setMyLocation(regResult.myOrgLocation);

      const byName = new Map<string, BroadcastOrgDirectoryItem>();
      [...mapOrgs, ...regOrgs].forEach((item) => {
        const key = normalizeName(item.name);
        if (!key || key === normalizeName(username)) {
          return;
        }

        const existing = byName.get(key);
        if (!existing) {
          byName.set(key, item);
          return;
        }

        // Prefer registration details when available because they are app-curated.
        if (existing.source === "map" && item.source === "registration") {
          byName.set(key, item);
          return;
        }

        if (!existing.city && item.city) {
          existing.city = item.city;
        }
        if (!existing.zip && item.zip) {
          existing.zip = item.zip;
        }
        if (!existing.missionArea && item.missionArea) {
          existing.missionArea = item.missionArea;
        }
        if ((existing.latitude === null || existing.longitude === null) && item.latitude !== null && item.longitude !== null) {
          existing.latitude = item.latitude;
          existing.longitude = item.longitude;
        }
        if ((existing.categories || []).length <= 1 && item.categories.length > 1) {
          existing.categories = item.categories;
        }
      });

      const directory = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
      setOrgDirectory(directory);
      setOrgOptions(directory.map((item) => item.name));
    } catch {
      setOrgOptions([]);
      setOrgDirectory([]);
      setMyLocation(null);
    }
  };

  const loadInbox = async () => {
    setLoadingInbox(true);
    try {
      const params = new URLSearchParams({ organization: username, mode: "inbox" });
      const response = await fetch(`${BROADCASTS_ENDPOINT}?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(String(payload?.message || "Could not load inbox"));
      }
      setInbox(Array.isArray(payload?.broadcasts) ? payload.broadcasts : []);
    } catch (err: any) {
      setError(String(err?.message || "Could not load inbox"));
    } finally {
      setLoadingInbox(false);
    }
  };

  const loadSent = async () => {
    setLoadingSent(true);
    try {
      const params = new URLSearchParams({ organization: username, mode: "sent" });
      const response = await fetch(`${BROADCASTS_ENDPOINT}?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(String(payload?.message || "Could not load sent broadcasts"));
      }
      setSent(Array.isArray(payload?.broadcasts) ? payload.broadcasts : []);
    } catch (err: any) {
      setError(String(err?.message || "Could not load sent broadcasts"));
    } finally {
      setLoadingSent(false);
    }
  };

  useEffect(() => {
    void loadOrgOptions();
    void loadInbox();
    void loadSent();
  }, []);

  const toggleRecipient = (orgName: string) => {
    if (selectedRecipients.includes(orgName)) {
      setSelectedRecipients(selectedRecipients.filter((name) => name !== orgName));
      return;
    }
    setSelectedRecipients([...selectedRecipients, orgName]);
  };

  const filteredDirectory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const zip = filterZip.trim();
    const category = filterCategory.trim().toLowerCase();
    const radius = Number(radiusMiles);

    return orgDirectory
      .map((org) => {
        let distanceMiles: number | null = null;
        if (myLocation && org.latitude !== null && org.longitude !== null) {
          distanceMiles = calculateMiles(myLocation.latitude, myLocation.longitude, org.latitude, org.longitude);
        }
        return { ...org, distanceMiles };
      })
      .filter((org) => {
        if (term) {
          const haystack = `${org.name} ${org.city} ${org.missionArea}`.toLowerCase();
          if (!haystack.includes(term)) {
            return false;
          }
        }

        if (zip && !String(org.zip || "").startsWith(zip)) {
          return false;
        }

        if (category) {
          const matched = org.categories.some((item) => item.toLowerCase().includes(category));
          if (!matched) {
            return false;
          }
        }

        if (nearMeOnly) {
          if (!myLocation || org.distanceMiles === null) {
            return false;
          }
          if (Number.isFinite(radius) && radius > 0 && org.distanceMiles > radius) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (a.distanceMiles === null && b.distanceMiles === null) {
          return a.name.localeCompare(b.name);
        }
        if (a.distanceMiles === null) return 1;
        if (b.distanceMiles === null) return -1;
        return a.distanceMiles - b.distanceMiles;
      });
  }, [orgDirectory, searchTerm, filterZip, filterCategory, nearMeOnly, radiusMiles, myLocation]);

  const addFilteredToShortlist = () => {
    const names = filteredDirectory.map((org) => org.name);
      setSelectedRecipients(Array.from(new Set([...selectedRecipients, ...names])));
  };

  const clearShortlist = () => {
    setSelectedRecipients([]);
  };

  const submitBroadcast = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const recipients = form.recipientMode === "all" ? orgOptions : selectedRecipients;
    if (recipients.length === 0) {
      setError("Choose at least one recipient organization.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        senderOrganization: form.senderOrganization,
        recipients,
        title: form.title,
        category: form.category,
        urgency: form.urgency,
        location: form.location,
        startDate: form.startDate,
        endDate: form.endDate,
        message: form.message,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
      };

      const response = await fetch(BROADCASTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(String(data?.message || "Could not send broadcast"));
      }

      setSuccess(`Broadcast sent to ${Number(data?.createdCount || 0)} organizations.`);
      setForm((prev) => ({
        ...prev,
        title: "",
        location: "",
        startDate: "",
        endDate: "",
        message: "",
        contactName: "",
        contactEmail: "",
      }));
      await loadSent();
    } catch (err: any) {
      setError(String(err?.message || "Could not send broadcast"));
    } finally {
      setSubmitting(false);
    }
  };

  const respondToBroadcast = async (entryId: string, responseStatus: "can-help" | "cannot-help" | "need-details") => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${BROADCASTS_ENDPOINT}/${entryId}/response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: username,
          responseStatus,
          responseNote: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(String(data?.message || "Could not save response"));
      }

      await Promise.all([loadInbox(), loadSent()]);
      setSuccess("Response recorded.");
    } catch (err: any) {
      setError(String(err?.message || "Could not save response"));
    }
  };

  return (
    <AnimatePresence>
      <motion.div key="org-broadcasts" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.45 }} className="flex flex-col items-center gap-4 px-6 py-8 w-full">
        <div className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm rounded-3xl px-8 py-7 shadow-lg border w-full max-w-5xl" style={{ borderColor: `${C.navy}08` }}>
          <div className="w-full flex justify-start -ml-2 mb-1"><BackButton onClick={onBack} /></div>
          <h2 className="text-3xl font-extrabold mt-1" style={{ color: C.navy }}>Broadcast Network</h2>
          <p className="text-sm text-center max-w-2xl" style={{ color: `${C.navy}60` }}>Send requests to partner organizations, track responses, and coordinate support in one place.</p>

          <div className="w-full mt-4 rounded-2xl border bg-white/85 p-2 grid grid-cols-3 gap-2" style={{ borderColor: `${C.navy}12` }}>
            {([
              ["compose", "Compose"],
              ["inbox", "Inbox"],
              ["sent", "Sent"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className="rounded-xl py-2 text-sm font-bold transition-colors"
                style={{
                  background: view === key ? C.blue : "rgba(255,255,255,0.8)",
                  color: view === key ? "#fff" : C.navy,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {error ? <p className="text-xs font-semibold mt-3 w-full" style={{ color: C.rose }}>{error}</p> : null}
          {success ? <p className="text-xs font-semibold mt-3 w-full" style={{ color: C.green }}>{success}</p> : null}

          {view === "compose" && (
            <form className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submitBroadcast}>
              <input type="text" value={form.senderOrganization} onChange={(e) => updateForm("senderOrganization", e.target.value)} placeholder="Sender organization" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none md:col-span-2" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Broadcast title" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none md:col-span-2" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <select value={form.category} onChange={(e) => updateForm("category", e.target.value)} className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={form.urgency} onChange={(e) => updateForm("urgency", e.target.value)} className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }}>
                {urgencies.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input type="text" value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="Location" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none md:col-span-2" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <textarea value={form.message} onChange={(e) => updateForm("message", e.target.value)} rows={4} placeholder="Message" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none md:col-span-2" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="text" value={form.contactName} onChange={(e) => updateForm("contactName", e.target.value)} placeholder="Contact name" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />
              <input type="email" value={form.contactEmail} onChange={(e) => updateForm("contactEmail", e.target.value)} placeholder="Contact email" className="rounded-xl border bg-white/90 px-4 py-3 text-sm outline-none" style={{ color: C.navy, borderColor: `${C.navy}15` }} />

              <div className="md:col-span-2 rounded-2xl border bg-white/80 p-4" style={{ borderColor: `${C.navy}12` }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: `${C.navy}45` }}>Recipients</p>
                <div className="flex items-center gap-4 mb-3">
                  <label className="text-sm font-semibold" style={{ color: C.navy }}>
                    <input type="radio" name="recipientMode" checked={form.recipientMode === "all"} onChange={() => updateForm("recipientMode", "all")} className="mr-2" />
                    All organizations ({orgOptions.length})
                  </label>
                  <label className="text-sm font-semibold" style={{ color: C.navy }}>
                    <input type="radio" name="recipientMode" checked={form.recipientMode === "selected"} onChange={() => updateForm("recipientMode", "selected")} className="mr-2" />
                    Shortlisted organizations ({selectedRecipients.length})
                  </label>
                </div>
                {form.recipientMode === "selected" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {selectedRecipients.length === 0 ? (
                      <p className="text-xs" style={{ color: `${C.navy}55` }}>No shortlisted organizations yet. Use the discovery section below.</p>
                    ) : (
                      selectedRecipients.map((name) => (
                        <label key={name} className="flex items-start gap-2 text-sm rounded-lg border px-2.5 py-2" style={{ color: C.navy, borderColor: `${C.navy}10` }}>
                          <input type="checkbox" checked={selectedRecipients.includes(name)} onChange={() => toggleRecipient(name)} />
                          <div>
                            <p className="font-semibold leading-tight">{name}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: `${C.navy}55` }}>Included in broadcast shortlist</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 rounded-2xl border bg-white/80 p-4" style={{ borderColor: `${C.navy}12` }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: `${C.navy}45` }}>Shortlist Source</p>
                  <span className="text-[11px] font-semibold" style={{ color: `${C.navy}55` }}>{selectedRecipients.length} selected</span>
                </div>
                <p className="text-xs mt-1" style={{ color: `${C.navy}55` }}>
                  Manage filters by ZIP, miles, and category in Map View tab. The shortlist you create there appears here automatically.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={clearShortlist} className="rounded-lg px-3 py-1.5 text-[11px] font-bold border" style={{ borderColor: `${C.navy}18`, color: C.navy }}>
                    Clear shortlist
                  </button>
                  <button type="button" onClick={() => { setError(""); setSuccess(""); void Promise.all([loadOrgOptions(), loadInbox(), loadSent()]); }} className="rounded-lg px-3 py-1.5 text-[11px] font-bold border" style={{ borderColor: `${C.navy}18`, color: C.navy }}>
                    Refresh data
                  </button>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.blue }}>
                {submitting ? "Sending..." : "Send Broadcast"}
              </button>
              <button type="button" onClick={() => { setError(""); setSuccess(""); void Promise.all([loadOrgOptions(), loadInbox(), loadSent()]); }} className="rounded-xl py-3 text-sm font-bold border" style={{ borderColor: `${C.navy}18`, color: C.navy }}>
                Refresh
              </button>
            </form>
          )}

          {view === "inbox" && (
            <div className="w-full mt-4 rounded-2xl border bg-white/85" style={{ borderColor: `${C.navy}12` }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: `${C.navy}08` }}>
                <h3 className="text-sm font-extrabold" style={{ color: C.navy }}>Incoming Broadcasts</h3>
                <button type="button" onClick={() => void loadInbox()} className="text-xs font-bold" style={{ color: C.blue }}>{loadingInbox ? "Loading..." : "Refresh"}</button>
              </div>
              {loadingInbox ? (
                <p className="px-4 py-4 text-xs" style={{ color: `${C.navy}55` }}>Loading inbox...</p>
              ) : inbox.length === 0 ? (
                <p className="px-4 py-4 text-xs" style={{ color: `${C.navy}55` }}>No broadcasts received yet.</p>
              ) : (
                <div className="divide-y" style={{ borderColor: `${C.navy}08` }}>
                  {inbox.map((item) => (
                    <div key={item.id} className="px-4 py-3">
                      <p className="text-sm font-bold" style={{ color: C.navy }}>{item.title}</p>
                      <p className="text-xs mt-1" style={{ color: `${C.navy}65` }}>{item.senderOrganization} · {item.category} · {item.urgency}</p>
                      <p className="text-xs mt-1" style={{ color: `${C.navy}65` }}>{item.location || "No location"} · {item.startDate || "No start date"}</p>
                      <p className="text-xs mt-2" style={{ color: `${C.navy}75` }}>{item.message}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button type="button" onClick={() => void respondToBroadcast(item.id, "can-help")} className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: C.green }}>Can Help</button>
                        <button type="button" onClick={() => void respondToBroadcast(item.id, "need-details")} className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: C.blue }}>Need Details</button>
                        <button type="button" onClick={() => void respondToBroadcast(item.id, "cannot-help")} className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: C.rose }}>Cannot Help</button>
                        <span className="rounded-lg px-3 py-1.5 text-[11px] font-bold" style={{ background: `${C.navy}12`, color: C.navy }}>
                          Status: {item.responseStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "sent" && (
            <div className="w-full mt-4 rounded-2xl border bg-white/85" style={{ borderColor: `${C.navy}12` }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: `${C.navy}08` }}>
                <h3 className="text-sm font-extrabold" style={{ color: C.navy }}>Sent Broadcasts</h3>
                <button type="button" onClick={() => void loadSent()} className="text-xs font-bold" style={{ color: C.blue }}>{loadingSent ? "Loading..." : "Refresh"}</button>
              </div>
              {loadingSent ? (
                <p className="px-4 py-4 text-xs" style={{ color: `${C.navy}55` }}>Loading sent broadcasts...</p>
              ) : sent.length === 0 ? (
                <p className="px-4 py-4 text-xs" style={{ color: `${C.navy}55` }}>No broadcasts sent yet.</p>
              ) : (
                <div className="divide-y" style={{ borderColor: `${C.navy}08` }}>
                  {sent.map((item) => (
                    <div key={item.broadcastId} className="px-4 py-3">
                      <p className="text-sm font-bold" style={{ color: C.navy }}>{item.title}</p>
                      <p className="text-xs mt-1" style={{ color: `${C.navy}65` }}>{item.category} · {item.urgency} · {item.location || "No location"}</p>
                      <p className="text-xs mt-2" style={{ color: `${C.navy}75` }}>{item.message}</p>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] font-bold">
                        <span className="rounded-lg px-2 py-1" style={{ background: `${C.navy}12`, color: C.navy }}>Total: {item.counts.total}</span>
                        <span className="rounded-lg px-2 py-1" style={{ background: `${C.blue}15`, color: C.blue }}>Pending: {item.counts.pending}</span>
                        <span className="rounded-lg px-2 py-1" style={{ background: `${C.green}15`, color: C.green }}>Can help: {item.counts.canHelp}</span>
                        <span className="rounded-lg px-2 py-1" style={{ background: `${C.rose}15`, color: C.rose }}>Cannot: {item.counts.cannotHelp}</span>
                        <span className="rounded-lg px-2 py-1" style={{ background: `${C.lightBlue}50`, color: C.navy }}>Need details: {item.counts.needDetails}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
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
  const [broadcastShortlist, setBroadcastShortlist] = useState<string[]>([]);

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
      {screen !== "donor-map" && screen !== "org-landing" && screen !== "org-register" && screen !== "org-shifts" && screen !== "org-broadcasts" && (
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
        <OrgDashboard username={orgUsername} onOpenRegistration={() => setScreen("org-register")} onOpenShifts={() => setScreen("org-shifts")} onOpenBroadcasts={() => setScreen("org-broadcasts")} shortlistRecipients={broadcastShortlist} onShortlistChange={setBroadcastShortlist} onSignOut={() => { setOrgAuthError(""); setOrgAuthSuccess(""); setOrgSignInForm({ username: "", password: "" }); setOrgCreateForm({ username: "", password: "", confirmPassword: "" }); setBroadcastShortlist([]); setScreen("home"); }} />
      )}

      {screen === "org-register" && (
        <OrganizationRegistrationScreen
          onBack={() => setScreen("org-landing")}
          onSaved={() => setScreen("org-landing")}
          username={orgUsername}
        />
      )}

      {screen === "org-shifts" && (
        <OrganizationShiftScreen
          onBack={() => setScreen("org-landing")}
          username={orgUsername}
        />
      )}

      {screen === "org-broadcasts" && (
        <OrganizationBroadcastScreen
          onBack={() => setScreen("org-landing")}
          username={orgUsername}
          shortlistRecipients={broadcastShortlist}
          onShortlistChange={setBroadcastShortlist}
        />
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
