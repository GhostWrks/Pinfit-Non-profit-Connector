# NonProfitFinder Backend (JavaScript)

Backend API for a data-driven community map platform where donors discover nearby nonprofits and nonprofits manage live needs.

## Tech Stack

- Node.js + Express
- ArcGIS REST JS (`@esri/arcgis-rest-*`) for geocoding, routing, and enrichment hooks
- Zod for request validation
- JWT for nonprofit authentication

## Setup

1. Install Node.js 20+.
2. Install dependencies:
   - `npm install`
3. Copy environment file:
   - `copy .env.example .env`
4. Start server:
   - `npm run dev`

Default API base URL: `http://localhost:4000/api`

## Dummy Frontend (Included)

Once the server is running, open:

- `http://localhost:4000/`

The landing page includes two options:

- `Explore as Donor`
- `Sign In as Nonprofit`

This is a lightweight demo UI for flow validation:

- Donor flow calls real backend search endpoints.
- Nonprofit flow is UI-first and currently saves form state locally in the browser.

## Demo Nonprofit Login

Use one of these credentials:

- `hello@riverbendpantry.org` / `np-demo-123`
- `contact@horizonyouth.org` / `np-demo-123`

## Endpoints

### Health

- `GET /api/health`

### Donor (Public)

- `GET /api/donor/search`
  - Query params:
    - `zip`
    - `lat`, `lon`
    - `distanceMiles` (1-25)
    - `needTypes` (comma-separated)
    - `organizationTypes` (comma-separated)
    - `volunteersNeeded` (`true`/`false`)
    - `category`
- `GET /api/donor/:id`
- `GET /api/donor/:id/route?originLat=34.05&originLon=-117.18&mode=drive-time`

### Organization Registrations (CSV-backed)

- `GET /api/registrations`
- `POST /api/registrations`
- `PUT /api/registrations/:id`

### Auth

- `POST /api/auth/nonprofit/login`
  - Body:
    ```json
    {
      "email": "hello@riverbendpantry.org",
      "password": "np-demo-123"
    }
    ```

### Nonprofit (JWT Required)

Set `Authorization: Bearer <token>`

- `GET /api/nonprofit/me`
- `PUT /api/nonprofit/profile`
- `PUT /api/nonprofit/needs`
- `GET /api/nonprofit/coverage`

### Analytics

- `GET /api/analytics/public`
- `GET /api/analytics/nonprofit/insights` (JWT required)

## ArcGIS Configuration

To enable ArcGIS geocode/route/enrichment calls, set `ARCGIS_API_KEY` in `.env`.

If no key is configured, the API still works using in-memory data and local buffer generation; ArcGIS-powered calls return graceful fallback responses.

## Data Model

Seed data lives in `data/nonprofits.seed.json` and includes:

- Nonprofit name
- Address + geocoded location
- Volunteers needed (Y/N)
- Needs list
- Main contact
- Hours
- Tags/categories
- Website
- Notes
- Last updated timestamp

This supports filtering, map popups, route requests, and dashboard metrics from one source.
