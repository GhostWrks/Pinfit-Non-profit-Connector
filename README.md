# PinHelp — Nonprofit Connector

A data-driven community platform where donors discover nearby nonprofits on an interactive map, and nonprofit organizations manage live needs, schedule volunteer shifts, and broadcast requests to partner orgs.

## Tech Stack

### Backend

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ (ES Modules) |
| Framework | Express 4 |
| Validation | Zod |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| Geospatial | ArcGIS REST JS (`@esri/arcgis-rest-geocoding`, `routing`, `request`, `feature-service`) |
| Security | Helmet (CSP), CORS |
| Logging | Morgan |
| Data Persistence | JSON seed file + CSV flat-file stores (no database required) |
| Dev Tooling | Nodemon |

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite 6 |
| Language | TypeScript (TSX) |
| Styling | Tailwind CSS 4 |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |
| UI Primitives | Radix UI, shadcn/ui components |
| Component Library | MUI (Material UI) 7 |
| Mapping | ArcGIS Maps SDK for JavaScript 4.30 (loaded via CDN) |
| Routing | React Router 7 |
| Charts | Recharts |

### Infrastructure

- No database — all data is stored in `data/*.csv` and `data/nonprofits.seed.json`
- Single-server deployment: Express serves the built frontend as static files
- Environment configured via `.env` (dotenv)

---

## Running Locally

### Prerequisites

- **Node.js 20+** (includes npm)
- An **ArcGIS API Key** (optional — the app works without it but geocoding/routing features will be disabled)

### 1. Clone the repository

```bash
git clone <repo-url>
cd Pinfit-Non-profit-Connector
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
npm run frontend:install
```

### 4. Configure environment variables

```bash
copy .env.example .env
```

Edit `.env` and fill in your values:

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=8h
ARCGIS_API_KEY=your-arcgis-api-key-here
ARCGIS_USERNAME=
ARCGIS_PASSWORD=
ARCGIS_PORTAL_URL=https://www.arcgis.com
DEFAULT_SEARCH_RADIUS_MILES=10
```

> `ARCGIS_USERNAME` and `ARCGIS_PASSWORD` are only needed for the Hotspot Analysis feature (spatial analysis jobs). All other ArcGIS features use the API key.

### 5. Build the frontend

```bash
npm run frontend:build
```

This outputs to `frontend/dist/` which Express serves as static files.

### 6. Start the server

```bash
npm run dev
```

The app will be available at **http://localhost:4000**

### Alternative: Run frontend in dev mode (hot reload)

In one terminal:
```bash
npm run dev
```

In a second terminal:
```bash
npm run frontend:dev
```

The Vite dev server will run on a separate port (typically 5173) with hot module replacement. API calls will need to be proxied or you can use the built frontend approach above.

---

## Demo Login

From the home page, click **Organization** > **Sign In**:

- Username: `admin` / Password: `admin` (UI demo login)

For the backend JWT-authenticated API endpoints:

- `hello@riverbendpantry.org` / `np-demo-123`
- `contact@horizonyouth.org` / `np-demo-123`

---

## API Endpoints

### Health

- `GET /api/health`

### Donor (Public)

- `GET /api/donor/search` — Search nonprofits by location, zip, keyword, needs, category
- `GET /api/donor/:id` — Get nonprofit details
- `GET /api/donor/:id/route` — Get driving/walking route to a nonprofit
- `POST /api/donor/hotspot-analysis` — Run ArcGIS FindHotSpots on SVI demographic data

### Organization Registrations (CSV-backed)

- `GET /api/registrations`
- `POST /api/registrations`
- `PUT /api/registrations/:id`

### Auth

- `POST /api/auth/nonprofit/login` — Get a JWT token

### Nonprofit (JWT Required)

- `GET /api/nonprofit/me` — Current org profile
- `PUT /api/nonprofit/profile` — Update profile (auto-geocodes address)
- `PUT /api/nonprofit/needs` — Update needs list
- `GET /api/nonprofit/coverage` — Service area analysis

### Analytics

- `GET /api/analytics/public` — Public dashboard metrics
- `GET /api/analytics/nonprofit/insights` — Org-specific insights (JWT required)

### Registrations (Public)

- `GET /api/registrations` — List all registered organizations
- `POST /api/registrations` — Register a new organization (auto-geocodes)
- `PUT /api/registrations/:id` — Update a registration

### Volunteer Shifts (Public)

- `GET /api/volunteer-shifts` — List all volunteer shifts
- `POST /api/volunteer-shifts` — Create a new shift

### Broadcasts (Public)

- `GET /api/broadcasts?organization=OrgName` — Inbox for an org
- `GET /api/broadcasts?organization=OrgName&mode=sent` — Sent broadcasts with response counts
- `POST /api/broadcasts` — Send a broadcast to multiple orgs
- `PATCH /api/broadcasts/:id/response` — Respond to a broadcast

---

## Project Structure

```
├── src/                    # Backend (Express)
│   ├── app.js             # Express app setup, middleware, route registration
│   ├── server.js          # HTTP server entry point
│   ├── config/env.js      # Environment variable loading
│   ├── middleware/         # Auth & error handling middleware
│   ├── routes/            # Route handlers (donor, nonprofit, auth, analytics, etc.)
│   ├── services/          # Business logic (ArcGIS, auth, data stores, CSV stores)
│   └── utils/             # Validation schemas, geo helpers
├── frontend/              # Frontend (React + Vite)
│   ├── src/app/App.tsx    # Main single-page app component
│   ├── src/app/components/# UI components (shadcn/ui, figma)
│   ├── index.html         # HTML entry point (loads ArcGIS SDK)
│   └── dist/              # Built output (served by Express)
├── data/                  # Flat-file data
│   ├── nonprofits.seed.json
│   ├── organization_registrations.csv  (auto-created)
│   ├── volunteer_shifts.csv            (auto-created)
│   └── broadcasts.csv                  (auto-created)
├── public/                # Fallback static assets
├── package.json           # Backend dependencies + scripts
└── .env.example           # Environment template
```

---

## ArcGIS Configuration

| Feature | Requires |
|---------|----------|
| Geocoding (address to lat/lon) | `ARCGIS_API_KEY` |
| Routing (directions) | `ARCGIS_API_KEY` |
| Service Area (isochrones) | `ARCGIS_API_KEY` |
| Interactive Map (feature layer) | `ARCGIS_API_KEY` |
| Hotspot Analysis (FindHotSpots) | `ARCGIS_USERNAME` + `ARCGIS_PASSWORD` |

If no API key is configured, the app still works with in-memory seed data and local buffer generation. ArcGIS-powered calls return graceful fallback responses.
