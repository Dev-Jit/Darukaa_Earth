# Darukaa.Earth

Darukaa.Earth is a geospatial dashboard for carbon-offset and biodiversity projects. Users register, create conservation **projects**, draw **site** polygons on a map, and inspect time-series charts for carbon and biodiversity metrics.

The git folder is `Daruka_Earth`; the product name is **Darukaa.Earth**.

Evaluator-facing architecture notes (schema, stack choices, mocked vs real data, hackathon trade-offs) live in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, Vite 6, React Router 7, Tailwind CSS 4, axios |
| Maps | Mapbox GL JS + Mapbox Draw |
| Charts | Highcharts |
| Backend | FastAPI (Python 3.12), SQLAlchemy, GeoAlchemy2, Alembic, JWT (HS256) |
| Database | PostgreSQL 16 + PostGIS |
| Quality | ESLint, Prettier, Black, Ruff, Husky + lint-staged |
| CI/CD | GitHub Actions → Vercel (SPA) + Render (API + Postgres) |

## Screenshots

Replace these placeholders with captures from a running session before submission.

### Login

![Login](docs/screenshots/login.png)

### Dashboard (project list)

![Dashboard](docs/screenshots/dashboard.png)

### Project map (draw sites)

![Project map](docs/screenshots/project-map.png)

### Site analytics

![Site analytics](docs/screenshots/site-analytics.png)

## Local development

### Prerequisites

- Git
- Python 3.12
- Node.js 20 + npm
- Docker Desktop (for PostGIS)

A Mapbox **public** token is required for maps (`VITE_MAPBOX_TOKEN`). Charts work without it; the map surfaces a missing-token message instead.

### 1. Clone and env files

```powershell
git clone <repo-url> Daruka_Earth
cd Daruka_Earth
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Edit `frontend/.env` and set `VITE_MAPBOX_TOKEN`. Leave `VITE_API_BASE_URL=http://localhost:8001` for local API.

Optional: set `GROQ_API_KEY` in `backend/.env` if you want live AI insights on the site page. Without it, the insights panel reports that generation is unavailable.

### 2. Database (PostGIS)

```powershell
docker compose up -d
docker compose ps
```

Compose maps host **5433** → container **5432** and runs `backend/migrations/0001_initial_schema.sql` on first empty volume.

### 3. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8001
```

- API: [http://localhost:8001](http://localhost:8001)
- Health: [http://localhost:8001/health](http://localhost:8001/health)
- OpenAPI: [http://localhost:8001/api/v1/docs](http://localhost:8001/api/v1/docs)

Creating a site via the API also writes **12 months of demo metrics** (carbon + biodiversity). To re-seed every site:

```powershell
cd backend
python scripts/seed_site_metrics.py --all --replace
```

### 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

Register → dashboard → create a project → draw a polygon → open the site for charts.

### 5. Tests and lint (optional locally)

```powershell
# from repo root
npm install
npm install --prefix frontend
npm run lint

cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

CI uses `TEST_DATABASE_URL` against PostGIS. Locally, `backend/tests/conftest.py` expects the Compose database unless you override that URL.

## Deployment URLs

Fill these in after the first production deploy.

| Surface | URL |
| --- | --- |
| Frontend (Vercel) | _pending — `https://<app>.vercel.app`_ |
| Backend (Render) | _pending — `https://<service>.onrender.com`_ |
| Health | `https://<service>.onrender.com/health` |

GitHub Actions:

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — pytest (PostGIS service), frontend lint + production build on every push/PR
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — after CI succeeds on `main`, deploys the SPA to Vercel and triggers a Render deploy

Required GitHub Actions secrets (deploy only): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RENDER_API_KEY`, `RENDER_SERVICE_ID`. Set `VITE_API_BASE_URL`, `VITE_MAPBOX_TOKEN` on Vercel, and `BACKEND_CORS_ORIGINS` (plus `JWT_SECRET`, optional `GROQ_API_KEY`) on Render. Do **not** put `DATABASE_URL` in GitHub; Render injects it from the managed database.

Blueprint: [`render.yaml`](render.yaml). SPA rewrites: [`frontend/vercel.json`](frontend/vercel.json).

## Repository layout

```
backend/     FastAPI app, Alembic, tests, seed scripts
frontend/    Vite React app
docs/screenshots/   README image placeholders
.github/workflows/  CI and deploy
```

Day-to-day implementation log: [`PROGRESS.md`](./PROGRESS.md).
