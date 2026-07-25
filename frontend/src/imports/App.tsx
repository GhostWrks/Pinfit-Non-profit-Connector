import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

type Screen =
  | "loading"
  | "home"
  | "org-choice"
  | "create-account"
  | "esri-prompt";

// ── PinfitLogo ────────────────────────────────────────────────────────────────
function PinfitLogo({ size = 80 }: { size?: number }) {
  const r = size / 2;
  const globeR = r * 0.58;
  const pinBodyH = r * 0.55;
  const pinW = r * 0.38;
  const pinTipH = r * 0.22;

  // Extra vertical space above for the curved text
  const textPad = size * 0.62;
  const totalH = size * 1.22 + textPad;
  // Arc path: a circle centred on the globe centre, radius slightly larger than globe
  const arcR = globeR * 1.55;
  const arcCx = r;
  const arcCy = globeR + textPad;
  // Start and end points of the arc (120° sweep, symmetric)
  const startAngle = -150 * (Math.PI / 180);
  const endAngle   = -30  * (Math.PI / 180);
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
      {/* Curved wordmark */}
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
      {/* All globe/pin elements shifted down by textPad */}
      <g transform={`translate(0, ${textPad})`}>
        {/* Globe */}
        <circle cx={r} cy={globeR} r={globeR} fill="#d4e9f7" stroke="#e84d6e" strokeWidth="1.8" />
        {/* Land mass blobs */}
        <ellipse cx={r * 0.82} cy={globeR * 0.75} rx={globeR * 0.28} ry={globeR * 0.22} fill="#b5d4a0" opacity="0.85" />
        <ellipse cx={r * 1.18} cy={globeR * 0.9} rx={globeR * 0.22} ry={globeR * 0.18} fill="#b5d4a0" opacity="0.8" />
        <ellipse cx={r * 0.95} cy={globeR * 1.25} rx={globeR * 0.3} ry={globeR * 0.16} fill="#b5d4a0" opacity="0.75" />
        {/* Longitude lines */}
        <ellipse cx={r} cy={globeR} rx={globeR * 0.5} ry={globeR} stroke="#7bafd4" strokeWidth="0.8" fill="none" opacity="0.45" />
        <line x1={r} y1={0} x2={r} y2={globeR * 2} stroke="#7bafd4" strokeWidth="0.8" opacity="0.35" />
        {/* Latitude lines */}
        <ellipse cx={r} cy={globeR} rx={globeR} ry={globeR * 0.3} stroke="#7bafd4" strokeWidth="0.8" fill="none" opacity="0.4" />
        <ellipse cx={r} cy={globeR} rx={globeR} ry={globeR * 0.65} stroke="#7bafd4" strokeWidth="0.8" fill="none" opacity="0.35" />
        {/* Pin body */}
        <rect
          x={r - pinW / 2}
          y={globeR * 2 - 2}
          width={pinW}
          height={pinBodyH}
          rx={pinW * 0.3}
          fill="#e84d6e"
        />
        {/* Pin tip */}
        <polygon
          points={`${r - pinW / 2},${globeR * 2 + pinBodyH - 2} ${r + pinW / 2},${globeR * 2 + pinBodyH - 2} ${r},${globeR * 2 + pinBodyH + pinTipH - 2}`}
          fill="#c73058"
        />
        {/* Pin highlight dot */}
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
      {/* Parchment base */}
      <rect width="1440" height="900" fill="#f5f0e8" />

      {/* Ocean fill */}
      <rect width="1440" height="900" fill="#cde5f4" opacity="0.45" />

      {/* Grid lines – latitude */}
      {[100, 200, 300, 400, 500, 600, 700, 800].map((y) => (
        <line key={`lat${y}`} x1="0" y1={y} x2="1440" y2={y} stroke="#a8c8e8" strokeWidth="0.6" opacity="0.5" />
      ))}
      {/* Grid lines – longitude */}
      {[120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320].map((x) => (
        <line key={`lon${x}`} x1={x} y1="0" x2={x} y2="900" stroke="#a8c8e8" strokeWidth="0.6" opacity="0.5" />
      ))}

      {/* Continents – simplified outlines filled with muted green */}
      {/* North America */}
      <path d="M60 120 Q110 80 200 90 Q280 95 320 140 Q360 180 350 240 Q340 300 300 340 Q260 380 220 400 Q180 380 160 340 Q130 290 100 260 Q70 230 60 180 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      {/* South America */}
      <path d="M200 440 Q260 420 300 460 Q340 500 330 580 Q320 660 280 700 Q240 730 210 700 Q175 660 170 580 Q165 510 185 470 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      {/* Europe */}
      <path d="M600 80 Q650 65 710 75 Q760 85 780 120 Q790 155 760 175 Q730 195 700 185 Q660 175 630 155 Q600 135 600 110 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      {/* Africa */}
      <path d="M620 220 Q680 200 730 215 Q780 230 800 290 Q820 360 810 440 Q800 510 770 550 Q740 580 700 575 Q660 570 640 535 Q610 490 600 420 Q585 340 590 270 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      {/* Asia */}
      <path d="M780 60 Q900 40 1040 55 Q1160 68 1220 110 Q1270 150 1260 210 Q1250 270 1200 300 Q1140 330 1060 320 Q980 310 920 280 Q860 250 820 210 Q780 170 770 120 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />
      {/* Australia */}
      <path d="M1080 480 Q1150 460 1210 490 Q1260 520 1250 590 Q1240 650 1190 670 Q1140 685 1100 655 Q1055 620 1055 560 Q1055 505 1080 480 Z" fill="#c5dba8" stroke="#a8c090" strokeWidth="1" opacity="0.75" />

      {/* Dotted pin markers */}
      {[
        [250, 200], [700, 300], [1150, 200], [320, 520], [1180, 540],
      ].map(([cx, cy], i) => (
        <g key={`pin${i}`} opacity="0.35">
          <circle cx={cx} cy={cy} r="5" fill="none" stroke="#e84d6e" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="2" fill="#e84d6e" />
        </g>
      ))}

      {/* Compass rose – bottom right */}
      <g transform="translate(1360, 820)" opacity="0.18">
        <circle cx="0" cy="0" r="28" fill="none" stroke="#1a1a2e" strokeWidth="1" />
        <line x1="0" y1="-28" x2="0" y2="28" stroke="#1a1a2e" strokeWidth="1" />
        <line x1="-28" y1="0" x2="28" y2="0" stroke="#1a1a2e" strokeWidth="1" />
        <polygon points="0,-28 -5,-10 5,-10" fill="#1a1a2e" />
        <text x="0" y="-32" textAnchor="middle" fontSize="10" fill="#1a1a2e" fontFamily="serif">N</text>
      </g>

      {/* Vignette overlay to keep center clean */}
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
      {/* House outline */}
      <path d="M8 22L24 8L40 22V40H30V30H18V40H8V22Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
      {/* Heart inside */}
      <path d="M24 34 C24 34 18 29.5 18 25.5 C18 23.5 19.8 22 22 22.8 C23 23.2 23.6 24 24 24 C24.4 24 25 23.2 26 22.8 C28.2 22 30 23.5 30 25.5 C30 29.5 24 34 24 34Z" fill="#e84d6e" stroke="none" />
    </svg>
  );
}

// ── DonorIcon ─────────────────────────────────────────────────────────────────
function DonorIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Person body */}
      <circle cx="24" cy="14" r="7" stroke="currentColor" strokeWidth="2.2" fill="none" />
      <path d="M10 38C10 30.3 16.3 24 24 24C31.7 24 38 30.3 38 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Hand with heart */}
      <path d="M20 36 L20 42 Q24 46 28 42 L28 36" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <path d="M24 40 C24 40 21 37.5 21 35.8 C21 34.8 22 34 23.2 34.5 C23.7 34.7 24 35.1 24 35.1 C24 35.1 24.3 34.7 24.8 34.5 C26 34 27 34.8 27 35.8 C27 37.5 24 40 24 40Z" fill="#e84d6e" />
    </svg>
  );
}

// ── LoadingRing ───────────────────────────────────────────────────────────────
// Orbits the globe portion of the logo (globe sits in top ~62% of textPad+globe height)
function LoadingRing({ size }: { size: number }) {
  const textPad = size * 0.62;
  const totalH = size * 1.22 + textPad;
  // Globe centre in the full SVG coordinate space
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
      {/* Map background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <MapBackground />
      </div>

      {/* ── Loading / Logo area ── */}
      {(screen === "loading" || screen === "home") && (
        <div className="relative flex flex-col items-center gap-8">
          {/* Logo + ring */}
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
              {showRing && (
                <LoadingRing size={LOGO_BASE} />
              )}
            </AnimatePresence>
          </div>

          {/* Tagline */}
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

          {/* Role buttons */}
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
                  <span className="text-muted-foreground group-hover:text-accent transition-colors duration-200">
                    <OrgIcon size={44} />
                  </span>
                  <span className="text-sm font-semibold text-foreground tracking-wide">Organization</span>
                </button>

                {/* Donor */}
                <button
                  className="group flex flex-col items-center gap-3 px-8 py-7 rounded-2xl bg-white/60 backdrop-blur-sm border border-black/10 shadow-sm transition-all duration-200 min-w-[148px] opacity-55 cursor-not-allowed"
                  aria-label="I am a Donor (coming soon)"
                  disabled
                >
                  <span className="text-muted-foreground">
                    <DonorIcon size={44} />
                  </span>
                  <span className="text-sm font-semibold text-foreground tracking-wide">Donor</span>
                  <span className="text-[10px] text-muted-foreground font-normal -mt-1">Coming soon</span>
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
            className="flex flex-col items-center gap-8 px-6"
          >
            <div className="flex flex-col items-center gap-2 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border border-black/8">
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

            <button
              onClick={() => setScreen("home")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
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
            className="flex flex-col items-center gap-8 px-6"
          >
            <div className="flex flex-col items-center gap-2 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border border-black/8">
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

            <button
              onClick={() => setScreen("org-choice")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
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
            className="flex flex-col items-center gap-8 px-6"
          >
            <div className="flex flex-col items-center gap-5 bg-white/70 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-lg border border-black/8 w-full max-w-xs">
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
                onClick={() => {/* Esri redirect would go here */}}
              >
                <EsriIcon />
                Continue to Esri
              </button>
            </div>

            <button
              onClick={() => setScreen("create-account")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
