# Architecture (evaluator notes)

This document explains how Darukaa.Earth is shaped, what is real vs demo, and which shortcuts we took under hackathon time.

## System shape

```
React SPA (Vercel)  --JWT-->  FastAPI (Render)
                                  |
                                  v
                         PostgreSQL + PostGIS
```

The SPA talks to a small REST API. Protected routes send `Authorization: Bearer <access_token>`. Site polygons are stored as PostGIS `geometry(Polygon, 4326)` and exchanged as GeoJSON. Time-series rows live in `site_metrics` and are plotted with Highcharts on the site page.

## Database schema

```
users 1───* projects 1───* sites 1───* site_metrics
```

| Table | Role |
| --- | --- |
| `users` | Email (unique), bcrypt hash, display name |
| `projects` | Named conservation program; `owner_id` → `users.id` (cascade delete) |
| `sites` | Named plot; `project_id` → `projects.id`; **PostGIS polygon** SRID 4326 + GiST index |
| `site_metrics` | One observation: `site_id`, `metric_type` (varchar), `value` (float), `recorded_at` |

UUIDs are primary keys (`gen_random_uuid()`). Timestamps are timezone-aware.

**Why this shape**

1. **Owner → project → site** matches the product: a user manages programs, each program has geographic plots. Ownership is a single foreign key, so authorization is `WHERE owner_id = current_user` (or join through `projects` for sites).
2. **Polygon on `sites`, not `projects`**, because a project can span multiple disconnected plots. WGS84 (4326) matches GeoJSON and Mapbox.
3. **EAV-style `site_metrics`** (`metric_type` + `value` + `recorded_at`) instead of wide columns (`carbon`, `ndvi`, …) or one table per indicator. Carbon, biodiversity, and later NDVI/canopy height arrive at different cadences; a wide row would be sparse and force a migration per new indicator. Composite indexes `(site_id, metric_type, recorded_at DESC)` and `(site_id, recorded_at DESC)` cover the site-detail query.

Trade-off of EAV: no cheap `CHECK` that NDVI ∈ [-1, 1]; cross-metric joins need `FILTER`/`crosstab`. That is acceptable at demo volume.

Plain SQL in `backend/migrations/` boots Docker on first volume; Alembic `0001_initial_schema` is the runtime path (`alembic upgrade head` on local and Render start).

## Why these libraries

**FastAPI** — Python is the natural fit for GeoAlchemy2/PostGIS. FastAPI gives typed request bodies, OpenAPI at `/api/v1/docs`, and dependency-injected JWT (`get_current_user`) without a large Django-style stack.

**React + Vite** — Client-only dashboard (no SSR). Vite keeps HMR and production builds fast; React Router matches `/dashboard`, `/projects/:id`, `/sites/:id`.

**Mapbox GL JS + Draw** — WebGL stays usable if we later overlay satellite tiles. Draw emits GeoJSON polygons that match `SiteCreateBody.geometry` with no coordinate conversion. Cost: a Mapbox token and ToS. Leaflet would avoid the token but is weaker for future raster overlays.

**Highcharts** — Site charts are datetime series with hover tooltips and drag-zoom. Highcharts ships that without a date adapter + zoom plugin. Chart.js is lighter and fully open-source; matching the same UX would have taken more glue. Highcharts is free for non-commercial use; a commercial license would need review.

## Mocked vs real

| Piece | Status |
| --- | --- |
| Auth (register, login, bcrypt, JWT) | **Real** |
| Projects / sites CRUD (create + read) | **Real** (no update/delete endpoints) |
| Polygon validation and GeoJSON round-trip | **Real** (PostGIS storage, application validation) |
| `GET /sites/{id}/metrics` | **Real API** over **demo rows** |
| `site_metrics` values | **Mocked** — generated series, not satellite or field data |
| AI insights (`GROQ_API_KEY`) | **Real Groq call** over those same mock series; optional |

The generator (`backend/app/services/site_metrics_seed.py`) writes 12 monthly points for:

- `carbon_sequestration_tco2e`
- `biodiversity_index`

It runs when a site is created (so the site page is never empty in a demo) and from `python scripts/seed_site_metrics.py`. Render start (`backend/scripts/start.sh`) also seeds any sites that still lack rows.

**Production analogue:** the same table would be filled by ETL or webhooks — e.g. monthly biomass/NDVI carbon estimates and biodiversity indices from surveys or acoustics — not by this RNG helper.

The UI does not pretend the series are live telemetry. The API and schema are ingestion-ready; only the **source** of numbers is fake.

## Hackathon trade-offs (and what we would change)

1. **Access token only (24h), stored in `localStorage`**  
   Enough for a judged demo. Given more time: short-lived access token + httpOnly refresh cookie, rotation, logout/revocation, password reset.

2. **Create/read only; no project or site update/delete in the API**  
   Matches the original endpoint list and saved UI work. Next: PATCH/DELETE, optimistic UI, and confirm-delete for polygons.

3. **Auto-seeded metrics instead of an ingestion pipeline**  
   Charts need data on day one. Next: keep the seed behind a flag; add `POST /sites/{id}/metrics` (or a worker) with provenance (`source`, `method`, units).

4. **Split hosting (Vercel + Render) and mixed URL prefixes**  
   Fast to wire. Auth/projects/sites sit at `/auth`, `/projects`, `/sites`; OpenAPI lives under `/api/v1`. Next: one `/api/v1` prefix, preview environments, and a paid always-on Postgres if Render free/idle is too slow for judges.

5. **Owner-only authorization, no roles or sharing**  
   Simple and testable. Next: org/membership, read-only auditors, and spatial queries (`ST_Area`, `ST_Intersects`) for portfolio maps on the dashboard.

## Request flow (site create)

1. UI draws a GeoJSON Polygon (Mapbox Draw) and posts `POST /projects/{id}/sites`.
2. FastAPI validates the polygon, checks project ownership, writes PostGIS geometry.
3. Seed helper inserts 24 metric rows (two types × 12 months).
4. Site page loads `GET /sites/{id}` + `GET /sites/{id}/metrics` and renders map + Highcharts.
