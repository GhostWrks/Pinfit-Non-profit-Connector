import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Search, SlidersHorizontal, X, Check } from "lucide-react";

type Screen =
  | "loading"
  | "home"
  | "org-choice"
  | "org-signin"
  | "create-account"
  | "org-landing"
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

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "food", label: "Food" },
  { value: "education", label: "Education" },
  { value: "housing", label: "Housing" },
  { value: "health", label: "Health" },
  { value: "clothing", label: "Clothing" }
];

type NonprofitResult = {
  id: string;
  name: string;
  address: string;
  zip: string;
  location: { lat: number; lon: number };
  volunteersNeeded: boolean;
  needs: string[];
  mainContact: string;
  contactPhone: string;
  hours?: string;
  category?: string;
  organizationType?: string;
};

type DonorSearchResponse = {
  query?: {
    effectiveCenter?: { lat: number; lon: number } | null;
  };
  results: NonprofitResult[];
};

declare global {
  interface Window {
    __APP_CONFIG?: {
      arcgisApiKey?: string;
    };
    require?: (
      modules: string[],
      onLoad: (...args: any[]) => void,
      onError?: (error: unknown) => void
    ) => void;
  }
}

const DONOR_WEB_MAP_ID = "279c71fd169b41ae96cde73e1fb6510a";

const ensureRuntimeConfig = async () => {
  if (window.__APP_CONFIG) {
    return window.__APP_CONFIG;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-app-config="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Config failed to load")), {
        once: true
      });
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
        "esri/WebMap",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/widgets/LayerList"
      ],
      (...modules) => resolve(modules),
      reject
    );
  });

// ── DonorMapScreen ─────────────────────────────────────────────────────────────
function DonorMapScreen({ onBack }: { onBack: () => void }) {
  const [queryText, setQueryText] = useState<string>("Redlands, CA");
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [results, setResults] = useState<NonprofitResult[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapViewRef = useRef<any>(null);
  const graphicsLayerRef = useRef<any>(null);
  const graphicCtorRef = useRef<any>(null);
  const graphicsByOrgIdRef = useRef<Map<string, any>>(new Map());
  const resultCardRefs = useRef<Map<string, HTMLArticleElement>>(new Map());

  const zoomToResult = (org: NonprofitResult) => {
    const view = mapViewRef.current;
    const graphic = graphicsByOrgIdRef.current.get(org.id);

    if (!view) {
      return;
    }

    try {
      if (graphic) {
        setSelectedOrgId(org.id);
        view.goTo(
          {
            target: graphic,
            zoom: 13
          },
          { animate: false }
        );
        view.popup.open({
          features: [graphic],
          location: graphic.geometry
        });
        return;
      }

      view.goTo(
        {
          center: [org.location.lon, org.location.lat],
          zoom: 13
        },
        { animate: false }
      );
    } catch {
      // Ignore map camera failures and keep the list interactive.
    }
  };

  const runSearch = async (params?: {
    locationQuery?: string;
    lat?: number;
    lon?: number;
  }) => {
    try {
      setError("");
      setIsLoading(true);

      const searchParams = new URLSearchParams();
      const locationQuery = params?.locationQuery ?? queryText;

      if (locationQuery.trim()) {
        searchParams.set("locationQuery", locationQuery.trim());
      }

      if (selectedCat.trim()) {
        searchParams.set("category", selectedCat);
      }

      if (Number.isFinite(params?.lat) && Number.isFinite(params?.lon)) {
        searchParams.set("lat", String(params?.lat));
        searchParams.set("lon", String(params?.lon));
      } else if (locationQuery.trim()) {
        searchParams.set("keyword", locationQuery.trim());
      }

      const response = await fetch(`/api/donor/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const payload = (await response.json()) as DonorSearchResponse;
      setResults(payload.results || []);

      const center = payload.query?.effectiveCenter;
      if (center && mapViewRef.current) {
        try {
          mapViewRef.current.goTo(
            { center: [center.lon, center.lat], zoom: 11 },
            { animate: false }
          );
        } catch {
          // Keep search results even if camera movement fails.
        }
      }
    } catch {
      setError("Could not load map results. Please try again.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!mapElementRef.current || mapViewRef.current) {
      return;
    }

    let searchHandle: { remove: () => void } | null = null;
    let popupFeatureHandle: { remove: () => void } | null = null;
    let popupVisibleHandle: { remove: () => void } | null = null;
    let view: any = null;

    ensureRuntimeConfig()
      .then(() => loadArcgisModules())
      .then(
        ([esriConfig, WebMap, MapView, GraphicsLayer, Graphic, LayerList]) => {
          const apiKey = window.__APP_CONFIG?.arcgisApiKey;
          if (apiKey) {
            esriConfig.apiKey = apiKey;
          }

          graphicCtorRef.current = Graphic;

          const graphicsLayer = new GraphicsLayer();
          graphicsLayerRef.current = graphicsLayer;

          const map = new WebMap({
            portalItem: {
              id: DONOR_WEB_MAP_ID
            }
          });

          map.add(graphicsLayer);

          view = new MapView({
            container: mapElementRef.current,
            map,
            center: [-117.1825, 34.0558],
            zoom: 11,
            popup: {
              dockEnabled: true,
              dockOptions: {
                position: "bottom-right",
                breakpoint: false
              }
            }
          });

          mapViewRef.current = view;

          const layerList = new LayerList({
            view
          });

          view.ui.add(layerList, "top-left");

          popupFeatureHandle = view.popup.watch("selectedFeature", (feature: any) => {
            const nextId = feature?.attributes?.id;
            setSelectedOrgId(typeof nextId === "string" ? nextId : null);
          });

          popupVisibleHandle = view.popup.watch("visible", (visible: boolean) => {
            if (!visible) {
              setSelectedOrgId(null);
            }
          });

          runSearch({ locationQuery: "Redlands, CA" });
        }
      )
      .catch(() => {
        setError("ArcGIS failed to load. Please refresh and try again.");
      });

    return () => {
      searchHandle?.remove();
      popupFeatureHandle?.remove();
      popupVisibleHandle?.remove();
      view?.destroy();
      mapViewRef.current = null;
      graphicsLayerRef.current = null;
      graphicCtorRef.current = null;
      graphicsByOrgIdRef.current.clear();
    };
    // Intentionally initialize the map once for this screen lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!graphicsLayerRef.current || !graphicCtorRef.current) {
      return;
    }

    graphicsLayerRef.current.removeAll();
    graphicsByOrgIdRef.current.clear();

    if (selectedOrgId && !results.some((org) => org.id === selectedOrgId)) {
      setSelectedOrgId(null);
    }

    results.forEach((org) => {
      const graphic = new graphicCtorRef.current({
        geometry: {
          type: "point",
          latitude: org.location.lat,
          longitude: org.location.lon
        },
        symbol: {
          type: "simple-marker",
          style: "circle",
          size: 10,
          color: org.volunteersNeeded ? "#da5a2f" : "#125347",
          outline: {
            color: "#ffffff",
            width: 1
          }
        },
        attributes: {
          id: org.id,
          name: org.name,
          address: org.address,
          needs: org.needs.join(", "),
          volunteersNeeded: org.volunteersNeeded ? "Yes" : "No"
        },
        popupTemplate: {
          title: "{name}",
          content:
            "<b>Address:</b> {address}<br/><b>Needs:</b> {needs}<br/><b>Volunteers Needed:</b> {volunteersNeeded}"
        }
      });

      graphicsLayerRef.current?.add(graphic);
      graphicsByOrgIdRef.current.set(org.id, graphic);
    });
  }, [results]);

  useEffect(() => {
    if (!selectedOrgId) {
      return;
    }

    const selectedCard = resultCardRefs.current.get(selectedOrgId);
    selectedCard?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest"
    });
  }, [selectedOrgId]);

  return (
    <motion.div
      key="donor-map"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col w-full min-h-[1250px]"
      style={{ fontFamily: "'Nunito', sans-serif", background: "#f5f0e8" }}
    >
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

        <form
          className="mt-4 border border-[#1a1a2e]/25 rounded-lg bg-white/90 flex items-center px-3 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            runSearch();
          }}
        >
          <Search size={16} className="text-[#1a1a2e]/40 flex-shrink-0" />
          <input
            type="text"
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Search by city, zip, area, or organization"
            className="flex-1 py-3 text-sm bg-transparent outline-none text-[#1a1a2e] placeholder:text-[#1a1a2e]/40"
          />
          <button
            type="submit"
            className="text-xs font-semibold text-[#1a1a2e]/80 hover:text-[#1a1a2e] transition-colors"
          >
            Search
          </button>
          <SlidersHorizontal size={16} className="text-[#1a1a2e]/50 flex-shrink-0" />
        </form>

        <div className="mt-3 flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setSelectedCat(cat.value);
                setTimeout(() => runSearch(), 0);
              }}
              className={`px-3 py-1 rounded-full text-xs border transition-all duration-150 ${
                cat.value === selectedCat
                  ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                  : "bg-white/80 text-[#1a1a2e] border-[#1a1a2e]/25 hover:border-[#1a1a2e]/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex-1 relative mx-4 mb-4 rounded-xl overflow-hidden border border-[#1a1a2e]/12 shadow-md"
        style={{ minHeight: 640 }}
      >
        <div ref={mapElementRef} className="absolute inset-0" />

        <div className="absolute bottom-3 right-3 bg-[#1a1a2e] text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded z-10">
          {isLoading ? "Loading..." : `${results.length} showing`}
        </div>

        {error ? (
          <div className="absolute bottom-3 left-3 z-10 bg-[#c0392b] text-white text-xs px-3 py-2 rounded max-w-[320px]">
            {error}
          </div>
        ) : null}
      </div>

      <section className="px-4 pb-10">
        <div className="rounded-2xl border border-[#1a1a2e]/10 bg-white/80 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#1a1a2e]/10 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c0392b]">Search Results</p>
              <h2 className="text-xl font-extrabold text-[#1a1a2e]">
                {isLoading ? "Looking up nearby nonprofits" : `${results.length} organizations found`}
              </h2>
            </div>
            <p className="max-w-sm text-right text-sm text-[#1a1a2e]/60">
              Use the custom search bar above and the layer list on the map to explore matching nonprofits.
            </p>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {results.length === 0 && !isLoading ? (
              <div className="rounded-xl border border-dashed border-[#1a1a2e]/20 bg-[#f5f0e8] px-4 py-8 text-sm text-[#1a1a2e]/65 md:col-span-2 xl:col-span-3">
                No matches yet. Try a city, zip code, area, or organization name.
              </div>
            ) : null}

            {results.map((org) => (
              <motion.article
                key={org.id}
                ref={(element) => {
                  if (element) {
                    resultCardRefs.current.set(org.id, element);
                    return;
                  }

                  resultCardRefs.current.delete(org.id);
                }}
                animate={
                  selectedOrgId === org.id
                    ? {
                        scale: [1, 1.012, 1],
                        boxShadow: [
                          "0 4px 18px rgba(26, 26, 46, 0.08)",
                          "0 10px 26px rgba(192, 57, 43, 0.18)",
                          "0 4px 18px rgba(26, 26, 46, 0.08)"
                        ]
                      }
                    : {
                        scale: 1,
                        boxShadow: "0 4px 18px rgba(26, 26, 46, 0.08)"
                      }
                }
                transition={
                  selectedOrgId === org.id
                    ? {
                        duration: 1.4,
                        ease: "easeInOut",
                        repeat: 2,
                        repeatDelay: 0.2
                      }
                    : {
                        duration: 0.2,
                        ease: "easeOut"
                      }
                }
                className={`rounded-xl border p-4 shadow-sm transition-all ${
                  selectedOrgId === org.id
                    ? "border-[#c0392b] bg-[#fff4ef] shadow-md ring-1 ring-[#c0392b]/30"
                    : "border-[#1a1a2e]/10 bg-[#fffdf9] hover:border-[#c0392b]/35"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#1a1a2e]">{org.name}</h3>
                    <p className="mt-1 text-sm text-[#1a1a2e]/65">{org.address}</p>
                  </div>
                  <span className="rounded-full bg-[#1a1a2e] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                    {org.category || "General"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-[#1a1a2e]/80">
                  <p><span className="font-semibold text-[#1a1a2e]">Needs:</span> {org.needs.join(", ")}</p>
                  <p><span className="font-semibold text-[#1a1a2e]">Contact:</span> {org.mainContact} · {org.contactPhone}</p>
                  {org.hours ? <p><span className="font-semibold text-[#1a1a2e]">Hours:</span> {org.hours}</p> : null}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                    org.volunteersNeeded ? "bg-[#fde7de] text-[#c0392b]" : "bg-[#e7f3ee] text-[#125347]"
                  }`}>
                    {org.volunteersNeeded ? "Volunteers Needed" : "Donations Accepted"}
                  </span>
                  <button
                    type="button"
                    onClick={() => zoomToResult(org)}
                    className="rounded-lg border border-[#1a1a2e]/15 px-3 py-2 text-xs font-semibold text-[#1a1a2e] transition-colors hover:border-[#1a1a2e]/35 hover:bg-[#f5f0e8]"
                  >
                    Show on map
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
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
  const [orgSignInForm, setOrgSignInForm] = useState({ username: "", password: "" });
  const [orgCreateForm, setOrgCreateForm] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [orgAuthError, setOrgAuthError] = useState("");
  const [orgAuthSuccess, setOrgAuthSuccess] = useState("");

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

  const handleOrgSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrgAuthSuccess("");

    const username = orgSignInForm.username.trim();
    const password = orgSignInForm.password;

    if (username === "admin" && password === "admin") {
      setOrgAuthError("");
      setScreen("org-landing");
      return;
    }

    setOrgAuthError("Invalid credentials. Use username: admin and password: admin.");
  };

  const handleCreateAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrgAuthError("");

    const username = orgCreateForm.username.trim();
    const password = orgCreateForm.password;
    const confirmPassword = orgCreateForm.confirmPassword;

    if (!username || !password || !confirmPassword) {
      setOrgAuthSuccess("");
      setOrgAuthError("Please fill in username, password, and confirm password.");
      return;
    }

    if (password !== confirmPassword) {
      setOrgAuthSuccess("");
      setOrgAuthError("Password and confirm password must match.");
      return;
    }

    setOrgAuthError("");
    setOrgAuthSuccess("Account successfully created.");
    setTimeout(() => {
      setScreen("org-landing");
    }, 700);
  };

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
                  onClick={() => {
                    setOrgAuthError("");
                    setOrgAuthSuccess("");
                    setOrgSignInForm({ username: "", password: "" });
                    setScreen("org-signin");
                  }}
                  className="w-full py-4 rounded-xl border border-black/15 text-foreground font-semibold text-base bg-white/50 hover:bg-white/80 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Org Sign In ── */}
      <AnimatePresence>
        {screen === "org-signin" && (
          <motion.div
            key="org-signin"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col items-center gap-4 px-6"
          >
            <div className="flex flex-col items-center gap-2 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border border-black/8 w-full max-w-md">
              <div className="w-full flex justify-start -ml-2 mb-1">
                <BackButton
                  onClick={() => {
                    setOrgAuthError("");
                    setOrgAuthSuccess("");
                    setScreen("org-choice");
                  }}
                />
              </div>
              <PinfitLogo size={44} />
              <h2 className="text-3xl font-extrabold text-foreground mt-2">Organization Sign In</h2>
              <p className="text-muted-foreground text-sm text-center max-w-xs">
                Dummy login for demo: username admin and password admin.
              </p>

              <form className="flex flex-col gap-3 w-full mt-4" onSubmit={handleOrgSignIn}>
                <input
                  type="text"
                  value={orgSignInForm.username}
                  onChange={(event) =>
                    setOrgSignInForm((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder="Username"
                  className="w-full rounded-xl border border-black/15 bg-white/90 px-4 py-3 text-sm text-[#1a1a2e] outline-none focus:border-[#1a1a2e]/40"
                />
                <input
                  type="password"
                  value={orgSignInForm.password}
                  onChange={(event) =>
                    setOrgSignInForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Password"
                  className="w-full rounded-xl border border-black/15 bg-white/90 px-4 py-3 text-sm text-[#1a1a2e] outline-none focus:border-[#1a1a2e]/40"
                />
                {orgAuthError ? (
                  <p className="text-xs font-semibold text-[#c0392b]">{orgAuthError}</p>
                ) : null}
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-md"
                >
                  Sign In
                </button>
              </form>
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
                This is a dummy create account form for UI demo flow.
              </p>

              <form className="flex flex-col gap-3 w-full max-w-xs mt-4" onSubmit={handleCreateAccount}>
                <input
                  type="text"
                  value={orgCreateForm.username}
                  onChange={(event) =>
                    setOrgCreateForm((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder="Username"
                  className="w-full rounded-xl border border-black/15 bg-white/90 px-4 py-3 text-sm text-[#1a1a2e] outline-none focus:border-[#1a1a2e]/40"
                />
                <input
                  type="password"
                  value={orgCreateForm.password}
                  onChange={(event) =>
                    setOrgCreateForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Password"
                  className="w-full rounded-xl border border-black/15 bg-white/90 px-4 py-3 text-sm text-[#1a1a2e] outline-none focus:border-[#1a1a2e]/40"
                />
                <input
                  type="password"
                  value={orgCreateForm.confirmPassword}
                  onChange={(event) =>
                    setOrgCreateForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  placeholder="Confirm Password"
                  className="w-full rounded-xl border border-black/15 bg-white/90 px-4 py-3 text-sm text-[#1a1a2e] outline-none focus:border-[#1a1a2e]/40"
                />
                {orgAuthError ? (
                  <p className="text-xs font-semibold text-[#c0392b]">{orgAuthError}</p>
                ) : null}
                {orgAuthSuccess ? (
                  <p className="text-xs font-semibold text-[#125347]">{orgAuthSuccess}</p>
                ) : null}
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-md"
                >
                  Create Account
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Organization Landing ── */}
      <AnimatePresence>
        {screen === "org-landing" && (
          <motion.div
            key="org-landing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4 px-6"
          >
            <div className="flex flex-col items-center gap-5 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border border-black/8 w-full max-w-xs">
              <div className="w-full flex justify-start -ml-2">
                <BackButton
                  onClick={() => {
                    setOrgAuthError("");
                    setOrgAuthSuccess("");
                    setScreen("org-choice");
                  }}
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <PinfitLogo size={44} />
                <h2 className="text-3xl font-extrabold text-foreground">Organization Landing</h2>
                <p className="text-muted-foreground text-sm text-center">
                  You are signed in. Welcome to your organization dashboard.
                </p>
              </div>

              <div className="w-full bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Demo Mode</span>
                <p className="text-xs text-emerald-800/90 leading-relaxed">
                  This is a dummy landing page for organization sign-in/create-account UI testing.
                </p>
              </div>

              <button
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-3 shadow-md"
                onClick={() => {
                  setOrgAuthError("");
                  setOrgAuthSuccess("");
                  setOrgSignInForm({ username: "", password: "" });
                  setOrgCreateForm({ username: "", password: "", confirmPassword: "" });
                  setScreen("home");
                }}
              >
                Go To Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Donor Map ── */}
      <AnimatePresence>
        {screen === "donor-map" && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f5f0e8]">
            <DonorMapScreen onBack={() => setScreen("home")} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
