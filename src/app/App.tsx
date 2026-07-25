import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Search, SlidersHorizontal, X, Check } from "lucide-react";

type Screen =
  | "loading"
  | "home"
  | "org-choice"
  | "create-account"
  | "esri-prompt"
  | "donor-map";

// ── Sample org data ───────────────────────────────────────────────────────────
const ORGS = [
  {
    name: "St. Alban Closet",
    address: "22 Chapel Ln",
    tags: ["Clothing", "Women's shelter"],
    contactName: "Ruth Adeyemi",
    contactPhone: "(555) 0155",
    hours: "Thu, 12–7",
    offers: ["Work clothes", "Shoes", "Blankets"],
    needs: ["Men's jackets", "Laundry detergent"],
    pinX: 54,
    pinY: 38,
  },
  {
    name: "Riverside Food Bank",
    address: "110 Harbor Ave",
    tags: ["Food drive", "Medical"],
    contactName: "James Okafor",
    contactPhone: "(555) 0212",
    hours: "Mon–Fri, 9–5",
    offers: ["Canned goods", "Fresh produce", "Baby formula"],
    needs: ["Cooking oil", "Pasta", "Diapers"],
    pinX: 65,
    pinY: 55,
  },
  {
    name: "Grace Legal Aid",
    address: "45 Westbrook Blvd",
    tags: ["Legal aid", "Tools"],
    contactName: "Maria Chen",
    contactPhone: "(555) 0339",
    hours: "Tue & Thu, 10–4",
    offers: ["Free consultations", "Document prep", "Notary"],
    needs: ["Filing fees", "Office supplies"],
    pinX: 40,
    pinY: 62,
  },
];

// ── PinfitLogo ────────────────────────────────────────────────────────────────
function PinfitLogo({ size = 80 }: { size?: number }) {
  const r = size / 2;
  const globeR = r * 0.58;
  const pinBodyH = r * 0.55;
  const pinW = r * 0.38;
  const pinTipH = r * 0.22;
  const textPad = size * 0.62;
  const totalH = size * 1.22 + textPad;
  const arcR = globeR * 1.55;
  const arcCx = r;
  const arcCy = globeR + textPad;
  const startAngle = -150 * (Math.PI / 180);
  const endAngle = -30 * (Math.PI / 180);
  const ax1 = arcCx + arcR * Math.cos(startAngle);
  const ay1 = arcCy + arcR * Math.sin(startAngle);
  const ax2 = arcCx + arcR * Math.cos(endAngle);
  const ay2 = arcCy + arcR * Math.sin(endAngle);
  const arcPath = `M ${ax1} ${ay1} A ${arcR} ${arcR} 0 0 1 ${ax2} ${ay2}`;
  const fontSize = size * 0.27;

  return (
    <svg
      width={size}
      height={totalH}
      viewBox={`0 0 ${size} ${totalH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pinfit logo"
    >
      <defs>
        <path id="textArc" d={arcPath} />
      </defs>
      <text
        fontSize={fontSize}
        fontWeight="800"
        fontFamily="'Nunito', sans-serif"
        fill="#1a1a2e"
        letterSpacing={size * 0.025}
      >
        <textPath href="#textArc" startOffset="50%" textAnchor="middle">
          PINFIT
        </textPath>
      </text>
      <g transform={`translate(0, ${textPad})`}>
        <circle cx={r} cy={globeR} r={globeR} fill="#d4e9f7" stroke="#e84d6e" strokeWidth="1.8" />
        <ellipse cx={r * 0.82} cy={globeR * 0.75} rx={globeR * 0.28} ry={globeR * 0.22} fill="#b5d4a0" opacity="0.85" />
        <ellipse cx={r * 1.18} cy={globeR * 0.9} rx={globeR * 0.22} ry={globeR * 0.18} fill="#b5d4a0" opacity="0.8" />
        <ellipse cx={r * 0.95} cy={globeR * 1.25} rx={globeR * 0.3} ry={globeR * 0.16} fill="#b5d4a0" opacity="0.75" />
        <ellipse cx={r} cy={globeR} rx={globeR * 0.5} ry={globeR} stroke="#7bafd4" strokeWidth="0.8" fill="none" opacity="0.45" />
        <line x1={r} y1={0} x2={r} y2={globeR * 2} stroke="#7bafd4" strokeWidth="0.8" opacity="0.35" />
        <ellipse cx={r} cy={globeR} rx={globeR} ry={globeR * 0.3} stroke="#7bafd4" strokeWidth="0.8" fill="none" opacity="0.4" />
        <ellipse cx={r} cy={globeR} rx={globeR} ry={globeR * 0.65} stroke="#7bafd4" strokeWidth="0.8" fill="none" opacity="0.35" />
        <rect x={r - pinW / 2} y={globeR * 2 - 2} width={pinW} height={pinBodyH} rx={pinW * 0.3} fill="#e84d6e" />
        <polygon
          points={`${r - pinW / 2},${globeR * 2 + pinBodyH - 2} ${r + pinW / 2},${globeR * 2 + pinBodyH - 2} ${r},${globeR * 2 + pinBodyH + pinTipH - 2}`}
          fill="#c73058"
        />
        <circle cx={r} cy={globeR} r={globeR * 0.18} fill="#e84d6e" opacity="0.9" />
      </g>
    </svg>
  );
}

// ── MapBackground ─────────────────────────────────────────────────────────────
function MapBackground() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1440" height="900" fill="#f5f0e8" />
      <rect width="1440" height="900" fill="#cde5f4" opacity="0.45" />
      {[100, 200, 300, 400, 500, 600, 700, 800].map((y) => (
        <line key={`lat${y}`} x1="0" y1={y} x2="1440" y2={y} stroke="#a8c8e8" strokeWidth="0.6" opacity="0.5" />
      ))}
      {[120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320].map((x) => (
        <line key={`lon${x}`} x1={x} y1="0" x2={x} y2="900" stroke="#a8c8e8" strokeWidth="0.6" opacity="0.5" />
      ))}
      <path d="M60 120 Q110 80 200 90 Q280 95 320 140 Q360 180 350 240 Q340 300 300 340 Q260 380 220 400 Q180 380 160 340 Q130 290 100 260 Q70 230 60 180 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      <path d="M200 440 Q260 420 300 460 Q340 500 330 580 Q320 660 280 700 Q240 730 210 700 Q175 660 170 580 Q165 510 185 470 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      <path d="M600 80 Q650 65 710 75 Q760 85 780 120 Q790 155 760 175 Q730 195 700 185 Q660 175 630 155 Q600 135 600 110 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      <path d="M620 220 Q680 200 730 215 Q780 230 800 290 Q820 360 810 440 Q800 510 770 550 Q740 580 700 575 Q660 570 640 535 Q610 490 600 420 Q585 340 590 270 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      <path d="M780 60 Q900 40 1040 55 Q1160 68 1220 110 Q1270 150 1260 210 Q1250 270 1200 300 Q1140 330 1060 320 Q980 310 920 280 Q860 250 820 210 Q780 170 770 120 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      <path d="M1080 480 Q1150 460 1210 490 Q1260 520 1250 590 Q1240 650 1190 670 Q1140 685 1100 655 Q1055 620 1055 560 Q1055 505 1080 480 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      {[[250, 200], [700, 300], [1150, 200], [320, 520], [1180, 540]].map(([cx, cy], i) => (
        <g key={`pin${i}`} opacity="0.35">
          <circle cx={cx} cy={cy} r="5" fill="none" stroke="#e84d6e" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="2" fill="#e84d6e" />
        </g>
      ))}
      <g transform="translate(1360, 820)" opacity="0.18">
        <circle cx="0" cy="0" r="28" fill="none" stroke="#1a1a2e" strokeWidth="1" />
        <line x1="0" y1="-28" x2="0" y2="28" stroke="#1a1a2e" strokeWidth="1" />
        <line x1="-28" y1="0" x2="28" y2="0" stroke="#1a1a2e" strokeWidth="1" />
        <polygon points="0,-28 -5,-10 5,-10" fill="#1a1a2e" />
        <text x="0" y="-32" textAnchor="middle" fontSize="10" fill="#1a1a2e" fontFamily="serif">N</text>
      </g>
      <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#f5f0e8" stopOpacity="0" />
        <stop offset="100%" stopColor="#f5f0e8" stopOpacity="0.55" />
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
      <path d="M24 34 C24 34 18 29.5 18 25.5 C18 23.5 19.8 22 22 22.8 C23 23.2 23.6 24 24 24 C24.4 24 25 23.2 26 22.8 C28.2 22 30 23.5 30 25.5 C30 29.5 24 34 24 34Z" fill="#e84d6e" stroke="none" />
    </svg>
  );
}

// ── DonorIcon ─────────────────────────────────────────────────────────────────
function DonorIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="14" r="7" stroke="currentColor" strokeWidth="2.2" fill="none" />
      <path d="M10 38C10 30.3 16.3 24 24 24C31.7 24 38 30.3 38 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M20 36 L20 42 Q24 46 28 42 L28 36" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <path d="M24 40 C24 40 21 37.5 21 35.8 C21 34.8 22 34 23.2 34.5 C23.7 34.7 24 35.1 24 35.1 C24 35.1 24.3 34.7 24.8 34.5 C26 34 27 34.8 27 35.8 C27 37.5 24 40 24 40Z" fill="#e84d6e" />
    </svg>
  );
}

// ── EsriIcon ──────────────────────────────────────────────────────────────────
function EsriIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Esri">
      <circle cx="12" cy="12" r="11" fill="#007AC2" />
      <path d="M7 8.5h10M7 12h7M7 15.5h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── LoadingRing ───────────────────────────────────────────────────────────────
function LoadingRing({ size }: { size: number }) {
  const textPad = size * 0.62;
  const totalH = size * 1.22 + textPad;
  const globeR = (size / 2) * 0.58;
  const globeCy = globeR + textPad;
  const ringR = globeR + size * 0.14;
  const pad = 24;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <svg
        width={size + pad * 2}
        height={totalH + pad * 2}
        viewBox={`${-pad} ${-pad} ${size + pad * 2} ${totalH + pad * 2}`}
        fill="none"
        aria-hidden="true"
      >
        <motion.circle
          cx={size / 2}
          cy={globeCy}
          r={ringR}
          stroke="#e84d6e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="140 60"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${size / 2}px ${globeCy}px` }}
          opacity={0.85}
        />
      </svg>
    </motion.div>
  );
}

// ── MapPin SVG ────────────────────────────────────────────────────────────────
function MapPin({ active = false }: { active?: boolean }) {
  const fill = active ? "#e84d6e" : "#c0392b";
  const stroke = active ? "#fff" : "#fff";
  return (
    <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 2C9.163 2 2 9.163 2 18C2 30 18 46 18 46C18 46 34 30 34 18C34 9.163 26.837 2 18 2Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
      />
      <circle cx="18" cy="18" r="6" fill="white" opacity="0.9" />
    </svg>
  );
}

// ── Street Map SVG ────────────────────────────────────────────────────────────
function StreetMap() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base */}
      <rect width="800" height="600" fill="#e8e0d0" />

      {/* Parks / green areas */}
      <rect x="480" y="60" width="180" height="140" rx="4" fill="#c8ddb8" opacity="0.7" />
      <rect x="80" y="380" width="120" height="90" rx="4" fill="#c8ddb8" opacity="0.65" />
      <rect x="580" y="400" width="160" height="120" rx="4" fill="#c8ddb8" opacity="0.65" />

      {/* Water */}
      <path d="M0 480 Q200 460 400 490 Q600 510 800 480 L800 600 L0 600 Z" fill="#b8d4e8" opacity="0.6" />

      {/* Major roads – horizontal */}
      <rect x="0" y="148" width="800" height="14" fill="#fff" opacity="0.9" />
      <rect x="0" y="298" width="800" height="14" fill="#fff" opacity="0.9" />
      <rect x="0" y="448" width="800" height="14" fill="#fff" opacity="0.9" />

      {/* Major roads – vertical */}
      <rect x="148" y="0" width="14" height="600" fill="#fff" opacity="0.9" />
      <rect x="348" y="0" width="14" height="600" fill="#fff" opacity="0.9" />
      <rect x="548" y="0" width="14" height="600" fill="#fff" opacity="0.9" />

      {/* Minor roads – horizontal */}
      {[80, 220, 375, 525].map((y, i) => (
        <rect key={`mh${i}`} x="0" y={y} width="800" height="6" fill="#f0ebe0" opacity="0.8" />
      ))}
      {/* Minor roads – vertical */}
      {[80, 248, 448, 648].map((x, i) => (
        <rect key={`mv${i}`} x={x} y="0" width="6" height="600" fill="#f0ebe0" opacity="0.8" />
      ))}

      {/* Blocks */}
      {[
        [20, 20, 54, 54],
        [100, 20, 34, 54],
        [170, 20, 64, 54],
        [260, 20, 74, 54],
        [20, 100, 54, 34],
        [100, 100, 34, 34],
        [170, 100, 64, 34],
        [20, 170, 54, 60],
        [100, 170, 34, 60],
        [170, 170, 64, 60],
        [260, 170, 74, 60],
        [380, 20, 54, 54],
        [460, 20, 54, 54],
        [380, 100, 54, 34],
        [380, 170, 54, 60],
        [460, 170, 54, 60],
        [580, 20, 54, 54],
        [660, 20, 54, 54],
        [580, 100, 54, 34],
        [580, 170, 54, 60],
        [660, 170, 54, 60],
        [20, 320, 54, 60],
        [100, 320, 34, 60],
        [170, 320, 64, 60],
        [260, 320, 74, 60],
        [380, 320, 54, 60],
        [460, 320, 54, 60],
        [580, 320, 54, 60],
        [660, 320, 54, 60],
      ].map(([x, y, w, h], i) => (
        <rect key={`blk${i}`} x={x} y={y} width={w} height={h} rx="2" fill="#d8d0be" opacity="0.6" />
      ))}
    </svg>
  );
}

// ── OrgCard ────────────────────────────────────────────────────────────────────
function OrgCard({ org, onClose }: { org: typeof ORGS[0]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="absolute z-30 w-72 shadow-xl rounded-b-xl overflow-hidden"
      style={{ left: `${org.pinX}%`, top: `${org.pinY + 8}%`, transform: "translateX(-50%)" }}
    >
      {/* Red header */}
      <div className="bg-[#c0392b] text-white px-4 py-3 flex items-start justify-between">
        <div>
          <p className="font-extrabold text-base leading-tight">{org.name}</p>
          <p className="text-xs text-red-100 mt-0.5">{org.address}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-3 text-white/80 hover:text-white transition-colors mt-0.5 flex-shrink-0"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* White body */}
      <div className="bg-white px-4 py-4 text-xs space-y-3">
        {/* Tags + avatar row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {org.tags.map((t) => (
              <span key={t} className="border border-[#1a1a2e]/20 text-[#1a1a2e] px-2 py-0.5 rounded text-[11px]">
                {t}
              </span>
            ))}
          </div>
          {/* Avatar circle */}
          <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-slate-100">
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="24" fill="#c8d4e4" />
              <circle cx="24" cy="19" r="8" fill="#8a9ab0" />
              <path d="M8 44C8 34.6 15.2 27 24 27C32.8 27 40 34.6 40 44" fill="#8a9ab0" />
            </svg>
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#c0392b] uppercase mb-0.5">Contact</p>
          <p className="text-[#1a1a2e]">{org.contactName} · {org.contactPhone}</p>
        </div>

        {/* Hours */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#c0392b] uppercase mb-0.5">Hours</p>
          <p className="text-[#1a1a2e]">{org.hours}</p>
        </div>

        {/* Offers */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#c0392b] uppercase mb-0.5">Offers</p>
          <ul className="space-y-0.5">
            {org.offers.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-[#1a1a2e]">
                <Check size={11} className="text-[#c0392b] flex-shrink-0" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Needs */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#c0392b] uppercase mb-0.5">Needs Donated</p>
          <ul className="space-y-0.5">
            {org.needs.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-[#1a1a2e]">
                <X size={11} className="text-[#c0392b] flex-shrink-0" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

const CATEGORIES = ["Food drive", "Women's shelter", "Clothing", "Medical", "Tools", "Legal aid"];

// ── DonorMapScreen ─────────────────────────────────────────────────────────────
function DonorMapScreen({ onBack }: { onBack: () => void }) {
  const [activeOrg, setActiveOrg] = useState<typeof ORGS[0] | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>("Women's shelter");
  const randomOrg = useRef(ORGS[Math.floor(Math.random() * ORGS.length)]).current;

  useEffect(() => {
    const t = setTimeout(() => setActiveOrg(randomOrg), 400);
    return () => clearTimeout(t);
  }, [randomOrg]);

  return (
    <motion.div
      key="donor-map"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col w-full h-full min-h-screen"
      style={{ fontFamily: "'Nunito', sans-serif", background: "#f5f0e8" }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-[#f5f0e8]">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/8 transition-colors text-[#1a1a2e]/60 hover:text-[#1a1a2e]"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <p className="text-xs text-[#1a1a2e]/50 tracking-wide">pinfit.org</p>
        </div>
        <h1 className="text-3xl font-extrabold text-[#1a1a2e] leading-tight ml-11">
          Who has what, and where
        </h1>

        {/* Search bar */}
        <div className="mt-4 border border-[#1a1a2e]/25 rounded-lg bg-white/90 flex items-center px-3 gap-2">
          <Search size={16} className="text-[#1a1a2e]/40 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search a place, street, or item..."
            className="flex-1 py-3 text-sm bg-transparent outline-none text-[#1a1a2e] placeholder:text-[#1a1a2e]/40"
          />
          <SlidersHorizontal size={16} className="text-[#1a1a2e]/50 flex-shrink-0" />
        </div>

        {/* Category chips */}
        <div className="mt-3 flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat === selectedCat ? "" : cat)}
              className={`px-3 py-1 rounded-full text-xs border transition-all duration-150 ${
                cat === selectedCat
                  ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                  : "bg-white/80 text-[#1a1a2e] border-[#1a1a2e]/25 hover:border-[#1a1a2e]/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative mx-4 mb-4 rounded-xl overflow-hidden border border-[#1a1a2e]/12 shadow-md" style={{ minHeight: 420 }}>
        <StreetMap />

        {/* The one random pin */}
        <div
          className="absolute z-20 cursor-pointer"
          style={{
            left: `${randomOrg.pinX}%`,
            top: `${randomOrg.pinY}%`,
            transform: "translate(-50%, -100%)",
          }}
          onClick={() => setActiveOrg(activeOrg ? null : randomOrg)}
        >
          <motion.div
            animate={activeOrg ? { scale: 1.15 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <MapPin active={!!activeOrg} />
          </motion.div>
        </div>

        {/* Org popup card */}
        <AnimatePresence>
          {activeOrg && (
            <OrgCard org={activeOrg} onClose={() => setActiveOrg(null)} />
          )}
        </AnimatePresence>

        {/* Counter badge */}
        <div className="absolute bottom-3 right-3 bg-[#1a1a2e] text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded">
          1 of {ORGS.length} showing
        </div>
      </div>
    </motion.div>
  );
}

// ── BackButton ────────────────────────────────────────────────────────────────
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-black/5"
    >
      <ArrowLeft size={13} />
      Back
    </button>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [logoScale, setLogoScale] = useState(2.4);
  const [showRing, setShowRing] = useState(true);

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

  const LOGO_BASE = 80;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden relative"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Map background (not shown on donor-map screen) */}
      {screen !== "donor-map" && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <MapBackground />
        </div>
      )}

      {/* ── Loading / Home ── */}
      {(screen === "loading" || screen === "home") && (
        <div className="relative flex flex-col items-center gap-8">
          <div
            className="relative flex items-center justify-center"
            style={{
              width: LOGO_BASE * logoScale + 60,
              height: (LOGO_BASE * 1.22 + LOGO_BASE * 0.62) * logoScale + 60,
              transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1), height 0.6s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <motion.div
              animate={{ scale: logoScale }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ originX: 0.5, originY: 0.5 }}
            >
              <PinfitLogo size={LOGO_BASE} />
            </motion.div>

            <AnimatePresence>
              {showRing && <LoadingRing size={LOGO_BASE} />}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {screen === "home" && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-muted-foreground text-sm font-light tracking-wide -mt-4"
              >
                Connecting those who give with those who need.
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {screen === "home" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="flex gap-5 mt-4"
              >
                {/* Organization */}
                <button
                  onClick={() => setScreen("org-choice")}
                  className="group flex flex-col items-center gap-3 px-8 py-7 rounded-2xl bg-white/80 backdrop-blur-sm border border-black/10 shadow-md hover:shadow-lg hover:border-accent/50 hover:bg-white transition-all duration-200 min-w-[148px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="I am an Organization"
                >
                  <span className="text-muted-foreground group-hover:text-[#e84d6e] transition-colors duration-200">
                    <OrgIcon size={44} />
                  </span>
                  <span className="text-sm font-semibold text-foreground tracking-wide">Organization</span>
                </button>

                {/* Donor – now enabled */}
                <button
                  onClick={() => setScreen("donor-map")}
                  className="group flex flex-col items-center gap-3 px-8 py-7 rounded-2xl bg-white/80 backdrop-blur-sm border border-black/10 shadow-md hover:shadow-lg hover:border-[#e84d6e]/40 hover:bg-white transition-all duration-200 min-w-[148px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="I am a Donor"
                >
                  <span className="text-muted-foreground group-hover:text-[#e84d6e] transition-colors duration-200">
                    <DonorIcon size={44} />
                  </span>
                  <span className="text-sm font-semibold text-foreground tracking-wide">Donor</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Org Choice ── */}
      <AnimatePresence>
        {screen === "org-choice" && (
          <motion.div
            key="org-choice"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col items-center gap-4 px-6"
          >
            <div className="flex flex-col items-center gap-2 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border border-black/8">
              <div className="w-full flex justify-start -ml-2 mb-1">
                <BackButton onClick={() => setScreen("home")} />
              </div>
              <PinfitLogo size={44} />
              <h2 className="text-3xl font-extrabold text-foreground mt-2">Organization</h2>
              <p className="text-muted-foreground text-sm">Choose how you&apos;d like to continue</p>

              <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
                <button
                  onClick={() => setScreen("create-account")}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-md"
                >
                  Create Account
                </button>
                <button
                  disabled
                  className="w-full py-4 rounded-xl border border-black/15 text-foreground font-semibold text-base opacity-40 cursor-not-allowed bg-white/50"
                >
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Account ── */}
      <AnimatePresence>
        {screen === "create-account" && (
          <motion.div
            key="create-account"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col items-center gap-4 px-6"
          >
            <div className="flex flex-col items-center gap-2 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border border-black/8">
              <div className="w-full flex justify-start -ml-2 mb-1">
                <BackButton onClick={() => setScreen("org-choice")} />
              </div>
              <PinfitLogo size={44} />
              <h2 className="text-3xl font-extrabold text-foreground mt-2">Create Account</h2>
              <p className="text-muted-foreground text-sm text-center max-w-xs">
                Register your organization to start connecting with donors worldwide.
              </p>

              <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
                <button
                  onClick={() => setScreen("esri-prompt")}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-3 shadow-md"
                >
                  <EsriIcon />
                  Create with Esri Account
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Esri Prompt ── */}
      <AnimatePresence>
        {screen === "esri-prompt" && (
          <motion.div
            key="esri-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4 px-6"
          >
            <div className="flex flex-col items-center gap-5 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border border-black/8 w-full max-w-xs">
              <div className="w-full flex justify-start -ml-2">
                <BackButton onClick={() => setScreen("create-account")} />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <EsriIcon size={36} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <h2 className="text-3xl font-extrabold text-foreground">Esri Account</h2>
                <p className="text-muted-foreground text-sm text-center">
                  You&apos;ll be redirected to Esri&apos;s secure login to complete your Pinfit setup.
                </p>
              </div>

              <div className="w-full bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Why Esri?</span>
                <p className="text-xs text-amber-800/80 leading-relaxed">
                  Pinfit uses Esri&apos;s trusted identity platform to verify organizations and keep your data secure.
                </p>
              </div>

              <button
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-3 shadow-md"
                onClick={() => {}}
              >
                <EsriIcon />
                Continue to Esri
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Donor Map ── */}
      <AnimatePresence>
        {screen === "donor-map" && (
          <div className="fixed inset-0 z-50 bg-[#f5f0e8]">
            <DonorMapScreen onBack={() => setScreen("home")} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
