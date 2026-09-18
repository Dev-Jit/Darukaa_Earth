-- =============================================================================
-- Migration Rollback: 0001_rollback_initial_schema.sql
-- Description: Rollback script for Darukaa.Earth initial database schema
-- =============================================================================

-- Drop tables in reverse order of foreign key dependency
DROP TABLE IF EXISTS site_metrics CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Note: PostGIS extension is typically left active in the database as other schemas
-- or spatial services might share it, but can be dropped if desired:
-- DROP EXTENSION IF EXISTS "postgis";
-- DROP EXTENSION IF EXISTS "uuid-ossp";
