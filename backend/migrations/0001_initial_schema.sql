-- =============================================================================
-- Migration: 0001_initial_schema.sql
-- Description: Initial PostgreSQL + PostGIS schema for Darukaa.Earth
-- Entities: users, projects, sites, site_metrics
-- =============================================================================

-- Step 1: Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- 1. Users Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'User accounts for authentication, authorization, and project ownership';
COMMENT ON COLUMN users.email IS 'Unique user email address for login and notifications';
COMMENT ON COLUMN users.hashed_password IS 'Bcrypt / Argon2 hashed password string';

-- =============================================================================
-- 2. Projects Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE projects IS 'Conservation and ecological carbon projects';
COMMENT ON COLUMN projects.owner_id IS 'Foreign key referencing the user who owns this project';

-- Indexes on projects
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- =============================================================================
-- 3. Sites Table (with PostGIS Polygon Geometry)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    geometry geometry(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sites IS 'Geospatial site boundaries associated with conservation projects';
COMMENT ON COLUMN sites.geometry IS 'PostGIS 2D Polygon boundary in WGS84 coordinates (EPSG:4326)';

-- Indexes on sites
CREATE INDEX IF NOT EXISTS idx_sites_project_id ON sites(project_id);
CREATE INDEX IF NOT EXISTS idx_sites_name ON sites(name);

-- Spatial GIST index for high-performance spatial intersections and bounding-box queries
CREATE INDEX IF NOT EXISTS idx_sites_geometry ON sites USING GIST (geometry);

-- =============================================================================
-- 4. Site Metrics Table (Time-series EAV schema)
-- =============================================================================
CREATE TABLE IF NOT EXISTS site_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    metric_type VARCHAR(64) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE site_metrics IS 'Time-series ecological and carbon metric measurements per site';
COMMENT ON COLUMN site_metrics.metric_type IS 'Identifier for the metric (e.g. carbon, biodiversity, canopy_cover, ndvi)';
COMMENT ON COLUMN site_metrics.value IS 'Numeric reading for the specified metric';
COMMENT ON COLUMN site_metrics.recorded_at IS 'Observation timestamp when the measurement was sampled or recorded';

-- Composite index optimized for time-series range queries filtered by site and metric type
CREATE INDEX IF NOT EXISTS idx_site_metrics_site_metric_recorded 
    ON site_metrics(site_id, metric_type, recorded_at DESC);

-- Index for retrieving all chronological metrics for a specific site
CREATE INDEX IF NOT EXISTS idx_site_metrics_site_recorded 
    ON site_metrics(site_id, recorded_at DESC);

-- Index for cross-site metric aggregations by type
CREATE INDEX IF NOT EXISTS idx_site_metrics_type 
    ON site_metrics(metric_type);
