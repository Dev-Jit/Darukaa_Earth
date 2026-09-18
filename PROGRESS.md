# Darukaa.Earth — Project Progress & Architecture Log

## Project Overview
Darukaa.Earth is a full-stack geospatial dashboard designed to manage, monitor, and visualize ecological data for carbon sequestration and biodiversity conservation projects. The platform couples interactive spatial boundary mapping with rich analytical charts, enabling project developers, auditors, and stakeholders to track ecological metrics, project baselines, and carbon stock calculations within a secure, high-performance web interface.

## Tech Stack
- **Monorepo Layout**: Dual-directory structure (`backend/` and `frontend/`)
- **Backend**: FastAPI (Python), JWT auth, projects/sites GeoJSON API
- **Frontend**: React 19 + Vite 6, React Router 7, Tailwind CSS 4, axios, Mapbox GL JS + mapbox-gl-draw, Highcharts
- **Geospatial Database**: PostgreSQL + PostGIS
- **Authentication**: JWT-based authentication (register, login, `get_current_user` dependency)
- **Code Quality & CI/CD**: Husky + lint-staged pre-commit (Prettier + ESLint on frontend; Black + Ruff on backend), GitHub Actions CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) and deploy-on-main ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) to **Vercel** (frontend) and **Render.com** (FastAPI + managed PostgreSQL/PostGIS)
- **Knowledge Graph & Codebase Intelligence**: Graphify (`graphifyy` CLI + AST parser)

## Architecture Decisions & Trade-offs
- **2026-09-18 — Hosting: Vercel (frontend) + Render.com (backend & Postgres/PostGIS)**:
  - *Decision*: Ship the Vite SPA on **Vercel** and the FastAPI API + database on **Render** (web service + managed PostgreSQL). GitHub Actions runs tests/lint/build on every push and PR; after CI succeeds on `main`, a second workflow deploys both targets.
  - *Why Vercel over Netlify*: Vercel is the path of least resistance for a Vite/React SPA (zero-config static output, SPA rewrites in [`frontend/vercel.json`](frontend/vercel.json), preview deploys per PR if you later enable them). The Hobby plan is free for this dashboard. **Netlify** would also host the static `frontend/dist` well, but Vercel’s GitHub + CLI (`VERCEL_TOKEN` / org / project IDs) is the more common Vite pairing and avoids a second static-hosting mental model.
  - *Why Render over Railway / Heroku*: This API **requires PostgreSQL + PostGIS** (`Geometry(POLYGON, 4326)`, GIST indexes, `PostGIS_Full_Version()` on `/health`). **Render Postgres** is a first-class managed add-on on the same account as the web service; you enable PostGIS with `CREATE EXTENSION postgis` (Alembic already does this on boot). Internal `DATABASE_URL` stays on the private network. **Railway** also supports PostGIS plugins and is excellent for hobby stacks, but the database and networking model is more “compose your own plugin” than a single Postgres product with a Blueprint ([`render.yaml`](render.yaml)). **Heroku** historically had a strong PostGIS add-on story, but the free/hobby landscape is gone, Eco dynos plus a production Postgres add-on are more expensive, and the GitHub integration is heavier than Render’s Blueprint + deploy API. Render Starter web + Basic Postgres is enough for a hackathon/MVP; web services may spin down on the cheapest plan (first request after idle is slow).
  - *Cost*: Vercel Hobby is free for the frontend. Render Postgres is **paid** (free Postgres was discontinued); `basic-256mb` in the Blueprint is the smallest current plan. Do not put production `DATABASE_URL` in GitHub secrets — it lives only on Render.
  - *Trade-offs*: Two vendors instead of one (vs Railway-all-in or Fly.io). CORS must list the Vercel origin on Render (`BACKEND_CORS_ORIGINS`). Vite bakes `VITE_API_BASE_URL` and `VITE_MAPBOX_TOKEN` at **build** time, so those must be set in the Vercel project (not only GitHub).
- **2026-09-16 — Frontend Visual Identity (Ecological Palette & Typography)**:
  - *Decision*: Grounded the UI in a field-ecology palette and type system rather than generic SaaS styling. **Colors**: Canopy `#1B4332` (primary), Loam `#B8860B` (warm earth accent / focus rings), Mist `#EFF2ED` (page background), Bark `#1A2620` (primary text), Silt `#5C6B63` (metadata/captions), Water `#3D6B7A` (biodiversity chart accent), Edge `#D4DDD6` (borders). **Typography**: Spectral (headings, 600/500) + IBM Plex Sans (body/UI, 400/500). **Scale**: page title 1.75rem, section heading 1.25rem, body 0.9375rem, caption 0.8125rem. **Components**: shared `btn-primary` / `btn-secondary`, 8px (`0.5rem`) radius on cards/maps/charts, title → description → metadata hierarchy with divider (no middle-dot meta strings). Highcharts pinned to `palette.colorScheme: 'light'` so charts match the light page when OS dark mode is on.
  - *Rationale*: Darukaa.Earth is a conservation-monitoring tool for forests and grasslands; the palette references canopy, soil, and water rather than template terracotta/cream or neon-on-black dashboards. Tokens live in [`frontend/src/index.css`](frontend/src/index.css) (`@theme`) and [`frontend/src/theme.js`](frontend/src/theme.js) for JS consumers (Highcharts, Mapbox).
- **2026-09-16 — Database Migration Strategy (Plain SQL Migrations + Alembic Infrastructure)**:
  - *Decision*: Authored pure SQL migrations (`backend/migrations/0001_initial_schema.sql` and `0001_rollback_initial_schema.sql`) as the declarative, engine-level source of truth, while concurrently providing full Alembic migration wiring (`backend/alembic.ini`, `backend/alembic/env.py`, and `backend/alembic/versions/0001_initial_schema.py`).
  - *Rationale*: Plain SQL migrations are completely portable, zero-dependency, and can run directly in Docker `docker-entrypoint-initdb.d/`, local `psql`, or lightweight CI test containers without requiring pre-installed Python packages or ORM runtime configurations. Alembic provides the migration runner and version history tracking (`alembic_version`) for the upcoming FastAPI + SQLAlchemy + GeoAlchemy2 application lifecycle.
- **2026-09-16 — Time-Series Site Metrics Modeling (Generic Key-Value EAV vs. Specialized Tables)**:
  - *Decision*: Structured `site_metrics` as a generic time-series entity with `(site_id, metric_type, value, recorded_at)` and composite indexing (`(site_id, metric_type, recorded_at DESC)`), rather than creating separate tables per metric (e.g., `carbon_metrics`, `biodiversity_metrics`) or wide column rows (`carbon_value`, `ndvi_value`, `canopy_cover_value`).
  - *Rationale*: 
    1. *Extensibility*: Ecological projects track diverse, evolving indicators (e.g., above-ground biomass, soil organic carbon, acoustic biodiversity index, canopy height, NDVI) that vary across certification standards (Verra, Gold Standard, Plan Vivo). Adding new metrics requires zero DDL schema migrations (`ALTER TABLE` or new tables).
    2. *Sparse & Asynchronous Sampling Rates*: Satellite NDVI arrives weekly/monthly, drone LiDAR semi-annually, soil core samples every 3–5 years, and acoustic sensors continuously. A wide single-table schema would suffer from extreme null sparsity and misaligned observation timestamps.
    3. *Dynamic Dashboard Consumption*: The frontend analytics and chart views can query any metric dynamically via a single unified API endpoint (`/sites/{id}/metrics?metric_type=...&from=...&to=...`) without bespoke backend route and serializer boilerplate.
  - *Trade-offs*:
    - *Type Homogeneity & Constraint Enforcement*: All metric values share a `DOUBLE PRECISION` numeric column; database-level domain constraints (e.g., NDVI strictly bounded between -1.0 and +1.0) cannot be enforced via standard column `CHECK` constraints without conditional triggers or application-level validation.
    - *Cross-Metric Correlations*: Analyzing multi-metric correlations at identical time intervals requires SQL self-joins or conditional aggregation (`FILTER (WHERE metric_type = ...)`), which is more computationally intensive than reading a single multi-column row.
    - *Storage Overhead at Massive Scale*: Repeating string identifiers across millions of records creates minor storage overhead, mitigated by a compact `VARCHAR(64)` and targeted composite B-tree indexing. If volume scales to tens of millions of events, migrating `site_metrics` into a TimescaleDB hypertable is seamless with this exact schema layout.
- **2026-09-16 — Graphify Knowledge Graph for Code Navigation**: Installed `graphifyy` via `pipx` with project-scoped rule integration (`.agents/rules/graphify.md`, `.agents/skills/graphify/`). Uses deterministic AST parsing via Tree-sitter for local code analysis across `backend/` and `frontend/` without external API token costs. `graphify-out/` is added to `.gitignore` so generated graph artifacts are kept local while maintaining persistent queryable context.
- **2026-09-16 — Monorepo Structure (`backend/` + `frontend/`)**: Chose a clean two-folder monorepo architecture with unified tracking (`PROGRESS.md`, `.gitignore`, root CI/CD hooks). *Rationale*: Keeps geospatial backend models, API contracts, and frontend dashboard components in a single synchronized git history without the overhead of heavy multi-package monorepo tooling (like Nx or Turborepo) until scale demands it.
- **2026-09-16 — JWT Authentication (Access Token Only, No Refresh Token Yet)**:
  - *Decision*: Issue a single **Bearer access token** (HS256) on login, validated via `get_current_user` on protected routes. Token lifetime is controlled by `ACCESS_TOKEN_EXPIRE_MINUTES` (default **1440** minutes / 24 hours in development). No refresh-token endpoint or rotating refresh cookie in this phase.
  - *Rationale*: Register/login plus a reusable auth dependency covers MVP backend and frontend integration with minimal moving parts (no refresh-token storage, rotation, or revocation table). Short-lived access tokens plus refresh pairs are the right next step when the dashboard needs silent session renewal without re-prompting passwords; until then, clients can re-login or cache the access token for the configured TTL.
  - *Security notes*: Passwords hashed with **bcrypt** (passlib); registration rejects weak passwords and duplicate emails (**409**); failed login returns **401** with a generic message.
- **2026-09-16 — Site Metrics Data Source (Seeded Mock vs. Production Pipeline)**:
  - *Decision*: `site_metrics` rows for demos are **generated by an offline seed script** ([`backend/scripts/seed_site_metrics.py`](backend/scripts/seed_site_metrics.py)), not produced by the API or a live ingestion service during this hackathon.
  - *Rationale*: The API and schema are built for real time-series ingestion, but satellite/analytics pipelines are out of scope for the sprint; seeding keeps charts populated for frontend evaluation without faking data inside request handlers.
  - *Production analogue (one line)*: In production, the same table would be fed by automated pipelines—e.g. **monthly carbon stock estimates from satellite biomass/NDVI models** plus **biodiversity indices from acoustic monitoring or field surveys**—landing via ETL jobs or webhooks, not manual seeds.
- **2026-09-16 — Frontend Auth State (React Context vs. Zustand)**:
  - *Decision*: **React Context API** (`AuthProvider` + `useAuth`) for session user, login/register/logout, and bootstrap from `/auth/me`.
  - *Rationale*: Auth is a single cohesive slice with a small API surface and no need for fine-grained subscriptions outside the provider tree yet; Context avoids an extra dependency and keeps JWT + user profile logic in one place. **Zustand** would be preferable later if many unrelated UI slices (map viewport, filters, chart brush) need performant updates without prop drilling—easy to migrate without changing route or API layers.
- **2026-09-16 — Frontend Tooling (Vite)**:
  - *Decision*: **Vite** for dev server and production builds (not Create React App or Next.js).
  - *Rationale*: Fast HMR, first-class ESM, minimal config for a client-only SPA that talks to the FastAPI backend; no SSR/routing-on-server requirement for this dashboard phase.
- **2026-09-16 — Interactive Site Drawing (Mapbox GL JS + mapbox-gl-draw vs. Leaflet + Leaflet.draw)**:
  - *Decision*: **Mapbox GL JS** with **@mapbox/mapbox-gl-draw** on the project detail page for rendering existing site polygons and drawing new GeoJSON boundaries.
  - *Rationale*: Mapbox GL is WebGL-based and stays smooth when many site polygons or future raster/vector overlays (satellite basemaps, NDVI tiles) are added. **mapbox-gl-draw** emits standard GeoJSON `Polygon` features that match the backend `SiteCreateBody.geometry` contract without coordinate conversion. Drawing UX (vertex snapping, double-click to close) is maintained by Mapbox and reduces custom canvas code.
  - *Alternatives considered*: **Leaflet + Leaflet.draw** is lighter and fully open-source with no token, but 2D canvas rendering degrades sooner with dense layers and custom styling is more fragmented across plugins. **OpenLayers** is powerful but heavier to integrate with React and overkill for MVP polygon CRUD.
  - *Trade-offs*: Requires a **Mapbox access token** (`VITE_MAPBOX_TOKEN`) and Mapbox ToS for map loads; token must stay out of git (Vite env only). mapbox-gl-draw styling is separate from Tailwind and needs bundled CSS. Site detail / dashboard mini-maps can reuse the same stack later for consistent behavior.
- **2026-09-16 — Site Analytics Charts (Highcharts vs. Chart.js)**:
  - *Decision*: **Highcharts** (`highcharts` + `highcharts-react-official`) for site detail time-series charts (carbon sequestration, biodiversity index).
  - *Rationale*: Ecological dashboards are primarily **datetime line charts** with hover tooltips and **x-axis zoom/pan** on long observation windows. Highcharts ships native datetime axes, zoom-by-drag, and formatted tooltips without extra plugins. Chart.js is lighter and fully open-source, but matching the same time-range UX requires `chartjs-adapter-date-fns` plus the zoom plugin and more manual axis/tooltip configuration for sparse monthly samples.
  - *Trade-offs*: Highcharts is free for non-commercial use under its license; commercial deployment would need a license review. Bundle size is slightly larger than Chart.js alone.
- **2026-09-16 — Pre-Commit Toolchain (Husky + lint-staged vs. pre-commit framework; Ruff vs. Flake8)**:
  - *Decision*: **Root Husky hook** → **lint-staged** (`lint-staged.config.mjs`) orchestrates all checks. Frontend: **Prettier** + **ESLint 9** (flat config, React/Hooks/Refresh plugins). Backend: **Black** (format) + **Ruff** (lint + import sort + auto-fix). Backend tools invoked via [`scripts/run-backend-tool.mjs`](scripts/run-backend-tool.mjs) (uses `backend/.venv` when present).
  - *Why Husky + lint-staged over the Python `pre-commit` framework*: The frontend already centers on npm; Husky installs via root `npm install` (`prepare` script) and lint-staged natively scopes checks to **staged files only** with glob patterns per folder—ideal for this two-folder monorepo without maintaining a second hook runner. The `pre-commit` framework excels at isolated Python hook environments and is better if the team is Python-primary or wants hooks without Node; here, one Git hook entry (`.husky/pre-commit` → `npx lint-staged`) keeps JS and Python checks in a single config developers already get from `npm install` at the repo root.
  - *Why Ruff over Flake8*: **Ruff** replaces Flake8, isort, and many plugins in one fast Rust binary, supports `--fix`, and reads rules from [`backend/pyproject.toml`](backend/pyproject.toml). Flake8 would need separate isort/autopep8 wiring and runs slower on every commit.
  - *Trade-offs*: Contributors need **Node.js** at the repo root for hooks even for backend-only edits (Python tools still run inside `backend/.venv`). Full-repo checks use `npm run lint` / `npm run format` at root.

### Pre-commit checks (exact sequence)
On every `git commit`, Husky runs `npx lint-staged`, which applies **only to staged files**:

| Glob | Step 1 | Step 2 |
|------|--------|--------|
| `frontend/**/*.{js,jsx,css}` | **Prettier** `--write` (reformats in place) | **ESLint** `--fix --max-warnings 0` (auto-fix + block on remaining errors/warnings) |
| `backend/**/*.py` | **Black** (reformats in place) | **Ruff** `check --fix` (auto-fix imports/style; block on remaining violations) |

If any step exits non-zero, **the commit is aborted** and unstaged working-tree files are untouched; staged files may already have been reformatted by Prettier/Black/Ruff fixers (re-`git add` after fixes to retry).

Manual full-repo baseline (no commit required):
```powershell
npm install                    # root: Husky + lint-staged
npm install --prefix frontend  # ESLint + Prettier
cd backend; pip install -r requirements-dev.txt
cd ..
npm run format                 # format everything once
npm run lint                   # verify clean baseline
```

## Deployment URLs
- **Frontend (Vercel)**: _pending first production deploy — paste the `*.vercel.app` (or custom domain) URL here_
- **Backend (Render)**: _pending first production deploy — paste the `https://<service>.onrender.com` URL here_
- **Health check**: `https://<service>.onrender.com/health` (expect `"database": "connected"` and a PostGIS version string)

## GitHub Actions secrets (repo Settings → Secrets and variables → Actions)

These are **GitHub repository secrets** used by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). CI itself needs **no** secrets.

| Secret | Used for | Where to get it |
|--------|----------|-----------------|
| `VERCEL_TOKEN` | Authenticate the Vercel CLI in Actions | [Vercel](https://vercel.com) → avatar → **Account Settings** → **Tokens** → **Create** (scope: the team/hobby account that owns the project). Copy once; it is not shown again. |
| `VERCEL_ORG_ID` | Identify the Vercel team/hobby account | After `npx vercel link` in `frontend/`, open `frontend/.vercel/project.json` and copy `orgId`. Or Vercel dashboard → team **Settings** → **General** → **Team ID**. Hobby personal accounts still have an org id. |
| `VERCEL_PROJECT_ID` | Identify this frontend project | Same `project.json` → `projectId`, or Vercel project → **Settings** → **General** → **Project ID**. |
| `RENDER_API_KEY` | Trigger a Render deploy from Actions | [Render](https://dashboard.render.com) → avatar → **Account Settings** → **API Keys** → **Create API Key**. |
| `RENDER_SERVICE_ID` | Which web service to deploy | Render dashboard → open the **darukaa-earth-api** web service → **Settings** → copy **Service ID** (`srv-…`). |

**Do not add `DATABASE_URL` to GitHub.** Set it on the Render web service (Blueprint wires it from the database `connectionString`). GitHub never needs production credentials.

**Set on the hosting dashboards (not GitHub):**

| Variable | Where | Value |
|----------|--------|--------|
| `VITE_API_BASE_URL` | Vercel project → Settings → Environment Variables (Production) | Render API origin, no trailing slash, e.g. `https://darukaa-earth-api.onrender.com` |
| `VITE_MAPBOX_TOKEN` | Vercel Production env | Public token from [Mapbox account tokens](https://account.mapbox.com/access-tokens/) |
| `DATABASE_URL` | Render web service (auto from Blueprint) | Internal Postgres URL (`postgres://…`); the app rewrites it to `postgresql+psycopg2://` |
| `JWT_SECRET` | Render (Blueprint can generate) | Long random string (`openssl rand -hex 32`) |
| `BACKEND_CORS_ORIGINS` | Render | JSON array including the Vercel origin, e.g. `["https://<app>.vercel.app"]` |
| `GROQ_API_KEY` | Render (optional) | [Groq console](https://console.groq.com/keys) if AI insights should work in production |
| `ENVIRONMENT` | Render | `production` |

## Progress Log

### 2026-09-18 — GitHub Actions CI/CD (Vercel + Render)
- **What was built**:
  - [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — on every push and pull request: install deps, run backend `pytest` against a `postgis/postgis:16-3.4` service, run frontend ESLint, run `vite build`. Any non-zero step fails the workflow.
  - [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — after **CI succeeds on a push to `main`** (or manual **Run workflow**), deploy `frontend/` to Vercel and trigger a Render deploy of the API.
  - [`render.yaml`](render.yaml) — Render Blueprint for `darukaa-earth-api` (Python, `backend/` root, Alembic then uvicorn) plus managed Postgres 16.
  - [`frontend/vercel.json`](frontend/vercel.json) — SPA fallback so React Router paths work on Vercel.
  - [`backend/scripts/start.sh`](backend/scripts/start.sh) — `alembic upgrade head` then bind uvicorn to `$PORT`.
  - Production URL helpers: Render `postgres://` → SQLAlchemy `postgresql+psycopg2://`; CORS origins parse JSON or comma-separated lists.
- **Deployment URLs**: not live until you create the Vercel/Render projects and add the GitHub secrets (see tables above).
- **How to verify**:
  1. Complete the GitHub + Vercel + Render UI steps (documented in the chat that landed this commit).
  2. Push to a branch / open a PR → **Actions** → **CI** green.
  3. Merge to `main` → **CI** then **Deploy** → Vercel production URL loads the app; `GET /health` on Render returns PostGIS.


### 2026-09-16 — Code Quality: Husky, lint-staged, ESLint, Prettier, Black, Ruff
- **What was built**:
  - Root [`package.json`](package.json), [`lint-staged.config.mjs`](lint-staged.config.mjs), [`.husky/pre-commit`](.husky/pre-commit).
  - Frontend: [`frontend/eslint.config.js`](frontend/eslint.config.js), [`frontend/.prettierrc.json`](frontend/.prettierrc.json), lint/format npm scripts.
  - Backend: [`backend/pyproject.toml`](backend/pyproject.toml), [`backend/requirements-dev.txt`](backend/requirements-dev.txt), [`scripts/run-backend-tool.mjs`](scripts/run-backend-tool.mjs).
  - Ran formatters/linters across the existing codebase; fixed Ruff/ESLint findings so `npm run lint` passes clean.
- **How to verify**:
  ```powershell
  npm install
  npm install --prefix frontend
  cd backend; pip install -r requirements-dev.txt; cd ..
  npm run lint
  # Introduce bad formatting in a staged file → git commit → hook reformats or blocks
  ```


### 2026-09-16 — Site Detail: Mini-Map & Metrics Charts
- **What was built**:
  - [`frontend/src/pages/SiteDetailPage.jsx`](frontend/src/pages/SiteDetailPage.jsx) — loads `GET /sites/{id}` and `GET /sites/{id}/metrics` in parallel; header, read-only boundary map, carbon + biodiversity charts, loading/error/empty states.
  - [`frontend/src/components/SitePolygonMap.jsx`](frontend/src/components/SitePolygonMap.jsx) — compact read-only Mapbox map for a single site polygon (reuses outdoors style and emerald fill from project map).
  - [`frontend/src/components/SiteMetricChart.jsx`](frontend/src/components/SiteMetricChart.jsx) — reusable Highcharts datetime chart with hover tooltips and x-axis zoom/pan.
  - API helpers [`frontend/src/api/sites.js`](frontend/src/api/sites.js); metric utilities [`frontend/src/utils/metrics.js`](frontend/src/utils/metrics.js).
  - Dependencies: `highcharts`, `highcharts-react-official`.
- **How to verify**:
  ```powershell
  cd backend
  python scripts/seed_site_metrics.py --all
  cd ../frontend
  npm install
  npm run dev
  # Login → open a project → click a site polygon → /sites/:id shows map + two charts
  # Site with no seeded metrics → "No metrics yet" empty state
  ```

### 2026-09-16 — Project Detail: Mapbox Site Map & Draw Flow
- **What was built**:
  - [`frontend/src/pages/ProjectDetailPage.jsx`](frontend/src/pages/ProjectDetailPage.jsx) — loads `GET /projects/{id}`, shows project header and site map section.
  - [`frontend/src/components/ProjectSitesMap.jsx`](frontend/src/components/ProjectSitesMap.jsx) — Mapbox GL map with existing sites as fill/line layers; click polygon → `/sites/:id`; “Draw new site” mode via mapbox-gl-draw; missing-token banner instead of blank map.
  - [`frontend/src/components/NewSiteDrawForm.jsx`](frontend/src/components/NewSiteDrawForm.jsx) — overlay form (site name) after polygon draw; `POST /projects/{id}/sites` then refresh.
  - API helper [`createSite`](frontend/src/api/projects.js); deps `mapbox-gl`, `@mapbox/mapbox-gl-draw`.
  - [`frontend/.env.example`](frontend/.env.example) — documents `VITE_MAPBOX_TOKEN`.
- **How to verify**:
  ```powershell
  cd frontend
  Copy-Item .env.example .env   # add VITE_MAPBOX_TOKEN=pk....
  npm install
  npm run dev
  # Login → open a project → map shows sites → Draw new site → name → Save → polygon appears → click → /sites/:id
  # Remove token and restart dev server → amber “Mapbox access token missing” message
  ```

### 2026-09-16 — Dashboard: Project List & Create Flow
- **What was built**:
  - [`frontend/src/pages/DashboardPage.jsx`](frontend/src/pages/DashboardPage.jsx) — fetches `GET /projects`, responsive project grid, loading/error/empty states, “Create project” entry points.
  - Reusable UI: [`Modal`](frontend/src/components/Modal.jsx), [`EmptyState`](frontend/src/components/EmptyState.jsx), [`ProjectCard`](frontend/src/components/ProjectCard.jsx), [`CreateProjectModal`](frontend/src/components/CreateProjectModal.jsx).
  - Reusable data hook [`useResourceList`](frontend/src/hooks/useResourceList.js) and API helpers [`frontend/src/api/projects.js`](frontend/src/api/projects.js) (pattern ready for sites on project detail).
  - Project cards show name, description, site count, created date; click navigates to `/projects/:id`.
  - Backend list response extended with `site_count` per project (`ProjectListItem`) so the dashboard avoids N+1 detail requests.
- **Screenshot** *(add later)*: Dashboard with header “Projects”, emerald “Create project” button, and a 2-column grid of white cards (title, truncated description, “N sites”, “Created Mon DD, YYYY”). Empty state: dashed border panel with “No projects yet” and primary CTA. Modal: “Create project” with name + optional description fields.
- **How to verify**:
  ```powershell
  # Backend + frontend running; register/login at http://localhost:5173
  # Dashboard → Create project → card appears → click card → /projects/:id
  ```

### 2026-09-16 — React Frontend Scaffold (Vite, Auth, Routing)
- **What was built**:
  - Vite + React app under [`frontend/`](frontend/) with Tailwind CSS 4 (`@tailwindcss/vite`).
  - Routes: `/login`, `/register`, `/dashboard` (protected), `/projects/:id` (protected), `/sites/:id` (protected).
  - Axios client [`frontend/src/api/client.js`](frontend/src/api/client.js): `VITE_API_BASE_URL`, attaches JWT, **401** on protected calls clears token and redirects to `/login` (login/register 401s excluded).
  - Auth: [`frontend/src/auth/AuthContext.jsx`](frontend/src/auth/AuthContext.jsx), token in `localStorage`, register → auto-login → dashboard.
  - Pages: login/register forms wired to backend; project/site detail placeholders (dashboard built in follow-up entry above).
- **Frontend layout**:
  ```
  frontend/
  ├── index.html
  ├── vite.config.js
  ├── package.json
  ├── .env.example          # VITE_API_BASE_URL=http://localhost:8001
  └── src/
      ├── main.jsx
      ├── App.jsx           # route definitions
      ├── api/client.js
      ├── auth/             # AuthContext, tokenStorage
      ├── components/       # AppShell, ProtectedRoute, AuthLayout, FormField
      └── pages/            # Login, Register, Dashboard, ProjectDetail, SiteDetail
  ```
- **How to run the dev server**:
  ```powershell
  cd frontend
  Copy-Item .env.example .env   # if not already present
  npm install
  npm run dev
  ```
  - App URL: [http://localhost:5173](http://localhost:5173) (ensure backend is on `VITE_API_BASE_URL`, default **8001**, with CORS allowing **5173**).
- **Production build**: `npm run build` → `frontend/dist/`; preview with `npm run preview`.


### 2026-09-16 — Project & Site Management API (JWT Protected, GeoJSON)
- **What was built**:
  - `POST /projects` — create project for current user.
  - `GET /projects` — list current user's projects.
  - `GET /projects/{id}` — project detail with nested `sites` (GeoJSON geometries).
  - `POST /projects/{id}/sites` — add site with validated GeoJSON `Polygon` boundary.
  - `GET /sites/{id}` — site detail (GeoJSON geometry).
  - `GET /sites/{id}/metrics` — time-series metrics with optional `metric_type`, `from`, `to` query filters.
  - Authorization: users only see/modify projects they own (**404** when another user's resource is requested).
  - Mock metrics seeder: `python scripts/seed_site_metrics.py --all` (optional `--site-id`, `--replace`).
  - Tests: [`backend/tests/test_projects_sites.py`](backend/tests/test_projects_sites.py) (PostgreSQL/PostGIS; set `TEST_DATABASE_URL` if not using Docker on port **5433**).
- **Seed mock analytics data**:
  ```powershell
  cd backend
  python scripts/seed_site_metrics.py --all
  ```
- **Manual smoke test** (after login; replace `TOKEN` and IDs):
  ```powershell
  curl.exe -X POST http://localhost:8001/projects -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"My Project\",\"description\":\"Optional\"}"
  curl.exe http://localhost:8001/projects -H "Authorization: Bearer TOKEN"
  curl.exe -X POST http://localhost:8001/projects/PROJECT_ID/sites -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"Plot A\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[77.209,28.614],[77.219,28.614],[77.219,28.624],[77.209,28.624],[77.209,28.614]]]}}"
  curl.exe http://localhost:8001/sites/SITE_ID/metrics -H "Authorization: Bearer TOKEN"
  ```

### 2026-09-16 — JWT Authentication (Register, Login, Protected Dependency)
- **What was built**:
  - `POST /auth/register` — create user (`email`, `password`, `name`) with Pydantic validation; **201** on success, **409** if email exists, **422** for invalid input.
  - `POST /auth/login` — returns `{ "access_token", "token_type": "bearer" }`; **401** on bad credentials.
  - `GET /auth/me` — example protected route using `get_current_user` (requires `Authorization: Bearer <token>`).
  - Core modules: [`app/core/security.py`](backend/app/core/security.py) (bcrypt + JWT), [`app/api/deps.py`](backend/app/api/deps.py) (`get_current_user`), [`app/crud/user.py`](backend/app/crud/user.py), [`app/api/v1/endpoints/auth.py`](backend/app/api/v1/endpoints/auth.py).
  - Pytest suite: [`backend/tests/test_auth.py`](backend/tests/test_auth.py) (register/login happy path, duplicate email, weak password, wrong password).
- **How to call manually** (API on port **8001**, adjust if needed):
  ```powershell
  # Register
  curl -X POST http://localhost:8001/auth/register `
    -H "Content-Type: application/json" `
    -d "{\"email\":\"dev@darukaa.earth\",\"password\":\"ChangeMe1\",\"name\":\"Dev User\"}"

  # Login (save access_token from response)
  curl -X POST http://localhost:8001/auth/login `
    -H "Content-Type: application/json" `
    -d "{\"email\":\"dev@darukaa.earth\",\"password\":\"ChangeMe1\"}"

  # Current user (replace TOKEN)
  curl http://localhost:8001/auth/me -H "Authorization: Bearer TOKEN"
  ```
- **Run tests**:
  ```powershell
  cd backend
  pytest
  ```


### 2026-09-16 — FastAPI Backend Scaffolding with PostGIS Models, Health Check & Docker Compose
- **What was built**:
  - Established a standard modular FastAPI architecture:
    - Configuration & Environment: [`app/core/config.py`](file:///c:/Projects/Daruka_Earth/backend/app/core/config.py) with `.env` loader, Pydantic settings, and CORS definitions.
    - Database Layer: [`app/db/base_class.py`](file:///c:/Projects/Daruka_Earth/backend/app/db/base_class.py), connection pooling in [`app/db/session.py`](file:///c:/Projects/Daruka_Earth/backend/app/db/session.py), and centralized model registry [`app/db/base.py`](file:///c:/Projects/Daruka_Earth/backend/app/db/base.py).
    - PostGIS ORM Models: [`User`](file:///c:/Projects/Daruka_Earth/backend/app/models/user.py), [`Project`](file:///c:/Projects/Daruka_Earth/backend/app/models/project.py), [`Site`](file:///c:/Projects/Daruka_Earth/backend/app/models/site.py) (with GeoAlchemy2 `Geometry(POLYGON, 4326)` and spatial GIST index), and [`SiteMetric`](file:///c:/Projects/Daruka_Earth/backend/app/models/site_metric.py) (composite time-series indexed).
    - Pydantic Validation Schemas: [`app/schemas/`](file:///c:/Projects/Daruka_Earth/backend/app/schemas/) for users, projects, sites, site metrics, and health check.
    - API Routing & Dependency Injection: [`app/api/deps.py`](file:///c:/Projects/Daruka_Earth/backend/app/api/deps.py), [`app/api/v1/api.py`](file:///c:/Projects/Daruka_Earth/backend/app/api/v1/api.py), and `/health` endpoint verifying live PostgreSQL connectivity and PostGIS version.
    - Alembic Migration Wiring: Linked `target_metadata = Base.metadata` in [`backend/alembic/env.py`](file:///c:/Projects/Daruka_Earth/backend/alembic/env.py) for automated schema synchronization.
    - Containerization & Secrets: Root [`docker-compose.yml`](file:///c:/Projects/Daruka_Earth/docker-compose.yml) running `postgis/postgis:16-3.4` with automatic initial migration mounting, and [`.env.example`](file:///c:/Projects/Daruka_Earth/.env.example) templates.
- **Files touched**:
  - [`docker-compose.yml`](file:///c:/Projects/Daruka_Earth/docker-compose.yml)
  - [`.env.example`](file:///c:/Projects/Daruka_Earth/.env.example)
  - [`backend/.env.example`](file:///c:/Projects/Daruka_Earth/backend/.env.example)
  - [`backend/requirements.txt`](file:///c:/Projects/Daruka_Earth/backend/requirements.txt)
  - [`backend/app/main.py`](file:///c:/Projects/Daruka_Earth/backend/app/main.py)
  - [`backend/main.py`](file:///c:/Projects/Daruka_Earth/backend/main.py)
  - [`backend/app/core/config.py`](file:///c:/Projects/Daruka_Earth/backend/app/core/config.py)
  - [`backend/app/db/base_class.py`](file:///c:/Projects/Daruka_Earth/backend/app/db/base_class.py)
  - [`backend/app/db/session.py`](file:///c:/Projects/Daruka_Earth/backend/app/db/session.py)
  - [`backend/app/db/base.py`](file:///c:/Projects/Daruka_Earth/backend/app/db/base.py)
  - [`backend/app/models/user.py`](file:///c:/Projects/Daruka_Earth/backend/app/models/user.py)
  - [`backend/app/models/project.py`](file:///c:/Projects/Daruka_Earth/backend/app/models/project.py)
  - [`backend/app/models/site.py`](file:///c:/Projects/Daruka_Earth/backend/app/models/site.py)
  - [`backend/app/models/site_metric.py`](file:///c:/Projects/Daruka_Earth/backend/app/models/site_metric.py)
  - [`backend/app/schemas/health.py`](file:///c:/Projects/Daruka_Earth/backend/app/schemas/health.py)
  - [`backend/app/schemas/user.py`](file:///c:/Projects/Daruka_Earth/backend/app/schemas/user.py)
  - [`backend/app/schemas/project.py`](file:///c:/Projects/Daruka_Earth/backend/app/schemas/project.py)
  - [`backend/app/schemas/site.py`](file:///c:/Projects/Daruka_Earth/backend/app/schemas/site.py)
  - [`backend/app/schemas/site_metric.py`](file:///c:/Projects/Daruka_Earth/backend/app/schemas/site_metric.py)
  - [`backend/app/api/deps.py`](file:///c:/Projects/Daruka_Earth/backend/app/api/deps.py)
  - [`backend/app/api/v1/api.py`](file:///c:/Projects/Daruka_Earth/backend/app/api/v1/api.py)
  - [`backend/app/api/v1/endpoints/health.py`](file:///c:/Projects/Daruka_Earth/backend/app/api/v1/endpoints/health.py)
  - [`backend/alembic/env.py`](file:///c:/Projects/Daruka_Earth/backend/alembic/env.py)
  - [`PROGRESS.md`](file:///c:/Projects/Daruka_Earth/PROGRESS.md)
- **How to run/test it**:
  - See updated instructions in "How to Run This Project Locally".

### 2026-09-16 — PostgreSQL + PostGIS Schema Design & Migrations
- **What was built**:
  - Designed the normalized relational schema with PostGIS spatial extension for Darukaa.Earth: `users`, `projects`, `sites` (with `geometry(Polygon, 4326)` and spatial GIST indexing), and `site_metrics` (high-throughput time-series with composite B-tree indexing).
  - Authored standalone, production-ready SQL migration scripts (`backend/migrations/0001_initial_schema.sql` and rollback `backend/migrations/0001_rollback_initial_schema.sql`).
  - Scaffolded Alembic migration infrastructure (`backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/script.py.mako`, and `backend/alembic/versions/0001_initial_schema.py`) to support future FastAPI / SQLAlchemy / GeoAlchemy2 application workflows.
- **Files touched**:
  - [`backend/migrations/0001_initial_schema.sql`](file:///c:/Projects/Daruka_Earth/backend/migrations/0001_initial_schema.sql)
  - [`backend/migrations/0001_rollback_initial_schema.sql`](file:///c:/Projects/Daruka_Earth/backend/migrations/0001_rollback_initial_schema.sql)
  - [`backend/alembic.ini`](file:///c:/Projects/Daruka_Earth/backend/alembic.ini)
  - [`backend/alembic/env.py`](file:///c:/Projects/Daruka_Earth/backend/alembic/env.py)
  - [`backend/alembic/script.py.mako`](file:///c:/Projects/Daruka_Earth/backend/alembic/script.py.mako)
  - [`backend/alembic/versions/0001_initial_schema.py`](file:///c:/Projects/Daruka_Earth/backend/alembic/versions/0001_initial_schema.py)
  - [`PROGRESS.md`](file:///c:/Projects/Daruka_Earth/PROGRESS.md)
- **How to run/test it**:
  - Execute plain SQL migration with `psql`:
    ```powershell
    psql -U postgres -d daruka_earth -f backend/migrations/0001_initial_schema.sql
    ```
  - Rollback plain SQL migration:
    ```powershell
    psql -U postgres -d daruka_earth -f backend/migrations/0001_rollback_initial_schema.sql
    ```
  - Execute via Alembic (once Python environment dependencies are installed):
    ```powershell
    cd backend
    alembic upgrade head
    ```

### 2026-09-16 — Graphify Installation, Scoping & Graph Generation
- **What was built**: Installed `graphifyy` tool via `pipx`, executed project-scoped integration with Antigravity / agent rules, added `graphify-out/` to `.gitignore`, configured `.graphifyignore`, established initial backend/frontend code entry points (`backend/main.py` and `frontend/src/App.jsx`), and generated the first knowledge graph across both subsystems (`graphify-out/graph.json`, `graph.html`, and `GRAPH_REPORT.md`).
- **Files touched**:
  - [`.gitignore`](file:///c:/Projects/Daruka_Earth/.gitignore)
  - [`.graphifyignore`](file:///c:/Projects/Daruka_Earth/.graphifyignore)
  - [`PROGRESS.md`](file:///c:/Projects/Daruka_Earth/PROGRESS.md)
  - [`backend/main.py`](file:///c:/Projects/Daruka_Earth/backend/main.py)
  - [`frontend/src/App.jsx`](file:///c:/Projects/Daruka_Earth/frontend/src/App.jsx)
  - [`.agents/rules/graphify.md`](file:///c:/Projects/Daruka_Earth/.agents/rules/graphify.md)
  - [`.agents/skills/graphify/SKILL.md`](file:///c:/Projects/Daruka_Earth/.agents/skills/graphify/SKILL.md)
  - [`.claude/`](file:///c:/Projects/Daruka_Earth/.claude)
  - [`CLAUDE.md`](file:///c:/Projects/Daruka_Earth/CLAUDE.md)
- **How to run/test it**:
  - Query graph: `graphify query "health_check"`
  - Explain node: `graphify explain "health_check"`
  - Update graph after code edits: `graphify update .` (or `graphify . --code-only`)
  - View interactive graph in browser: open `graphify-out/graph.html`

### 2026-09-16 — Initial Repository Scaffolding & Setup
- **What was built**: Initialized the project repository with a root monorepo layout containing `backend/` and `frontend/` directories, a comprehensive `.gitignore` targeting Python, Node.js, and geospatial development artifacts, root `README.md`, and structured `PROGRESS.md`.
- **Files touched**:
  - [`.gitignore`](file:///c:/Projects/Daruka_Earth/.gitignore)
  - [`README.md`](file:///c:/Projects/Daruka_Earth/README.md)
  - [`PROGRESS.md`](file:///c:/Projects/Daruka_Earth/PROGRESS.md)
  - [`backend/.gitkeep`](file:///c:/Projects/Daruka_Earth/backend/.gitkeep)
  - [`frontend/.gitkeep`](file:///c:/Projects/Daruka_Earth/frontend/.gitkeep)
- **How to run/test it**:
  - Clone or open repository in terminal.
  - Verify git history using `git log --oneline`.

## How to Run This Project Locally

### Prerequisites
- Git
- Python 3.11+ (Python 3.12 verified)
- Node.js 18+ / npm
- Docker & Docker Compose (or native PostgreSQL 16 with PostGIS extension)
- Graphify (`pipx install graphifyy`)

### Step 1: Environment Configuration
Copy `.env.example` to `.env` in the project root (and inside `backend/` if running backend directly):
```powershell
# From project root
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Install pre-commit tooling (once per clone):
```powershell
npm install
npm install --prefix frontend
cd backend
pip install -r requirements-dev.txt
cd ..
```

### Step 2: Start PostgreSQL + PostGIS Database (Docker)
Start the PostGIS database container in the background:
```powershell
# From project root
docker compose up -d
```
Verify the container is healthy:
```powershell
docker compose ps
```
*(The container mounts `backend/migrations/0001_initial_schema.sql` to `/docker-entrypoint-initdb.d/` so tables and extensions are created automatically on the first boot).*

### Step 3: Backend Setup & Dependencies
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 4: Run Database Migrations (Alembic)
Ensure the database schema is up-to-date:
```powershell
alembic upgrade head
```

### Step 5: Start the FastAPI Server
Use the **project virtualenv** (global `uvicorn` often lacks SQLAlchemy and other deps):
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt   # first time only
uvicorn app.main:app --reload --port 8001
```
Or: `.\run-dev.ps1` from `backend/` (creates `.venv`, copies `.env.example` if needed).

> **Port note**: If port `8000` is already in use by another application (triggering `[WinError 10013]`), use `--port 8001`.
> **Database port**: Docker Compose exposes Postgres on host **5433** — set `DATABASE_URL` in `backend/.env` accordingly (see `.env.example`).
- Interactive Swagger API Documentation: [http://localhost:8001/api/v1/docs](http://localhost:8001/api/v1/docs)
- Alternative ReDoc Documentation: [http://localhost:8001/api/v1/redoc](http://localhost:8001/api/v1/redoc)

### Step 6: Verify Health Endpoint
Test the API and DB connectivity check:
```powershell
# PowerShell:
Invoke-RestMethod http://localhost:8001/health
# Or curl:
curl http://localhost:8001/health
```
**Expected Response (when Database is running)**:
```json
{
  "status": "healthy",
  "service": "Darukaa.Earth API",
  "version": "0.1.0",
  "database": "connected",
  "postgis_version": "POSTGIS=\"3.4.2 ...\" ...",
  "details": {
    "postgis": "enabled"
  }
}
```

### Knowledge Graph Commands
- **Query the graph**:
  ```powershell
  graphify query "<concept_or_symbol>"
  ```
- **Inspect node relationships**:
  ```powershell
  graphify explain "<node_name>"
  ```
- **Trace paths between components**:
  ```powershell
  graphify path "<source_node>" "<target_node>"
  ```
- **Update graph after code changes**:
  ```powershell
  graphify update .
  ```

## Known Limitations / TODO
- [x] Integrate Graphify knowledge graph for codebase navigation and token optimization.
- [x] Design PostgreSQL + PostGIS database schema and migrations (Alembic & raw SQL).
- [x] Initialize backend application (FastAPI + PostGIS ORM + Pydantic models).
- [x] Initialize frontend application (Vite + React Router + auth shell).
- [x] Dashboard project list, create modal, and navigation to project detail.
- [x] Mapbox GL JS site map + polygon draw on project detail (`/projects/:id`).
- [x] Site detail mini-map and analytics charts (`/sites/:id`).
- [ ] Mapbox mini-maps / analytics charts on dashboard.
- [x] Implement JWT authentication flow.
- [x] Project & site management API (GeoJSON boundaries, owner-scoped access).
- [x] Configure Git pre-commit hooks (Husky, lint-staged, Prettier, ESLint, Black, Ruff).
- [x] Set up GitHub Actions CI/CD pipeline.
