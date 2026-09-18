from uuid import uuid4

from app.models.site import Site
from scripts.seed_site_metrics import seed_site_metrics

from conftest import INVALID_POLYGON, VALID_POLYGON


def _register_second_user(pg_client, email: str) -> dict:
    pg_client.post(
        "/auth/register",
        json={"email": email, "password": "securePass1", "name": "Other User"},
    )
    login = pg_client.post(
        "/auth/login",
        json={"email": email, "password": "securePass1"},
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_project_and_site_crud_flow(pg_client, pg_auth_headers):
    create_project = pg_client.post(
        "/projects",
        headers=pg_auth_headers,
        json={"name": "Western Ghats Restoration", "description": "Pilot plot"},
    )
    assert create_project.status_code == 201
    project = create_project.json()
    project_id = project["id"]
    assert project["name"] == "Western Ghats Restoration"
    assert project["owner_id"]

    listed = pg_client.get("/projects", headers=pg_auth_headers)
    assert listed.status_code == 200
    listed_body = listed.json()
    assert len(listed_body) == 1
    assert listed_body[0]["site_count"] == 0

    detail = pg_client.get(f"/projects/{project_id}", headers=pg_auth_headers)
    assert detail.status_code == 200
    assert detail.json()["sites"] == []

    create_site = pg_client.post(
        f"/projects/{project_id}/sites",
        headers=pg_auth_headers,
        json={"name": "Plot A", "geometry": VALID_POLYGON},
    )
    assert create_site.status_code == 201
    site = create_site.json()
    site_id = site["id"]
    assert site["geometry"]["type"] == "Polygon"
    assert site["geometry"]["coordinates"]

    detail_with_sites = pg_client.get(f"/projects/{project_id}", headers=pg_auth_headers)
    assert detail_with_sites.status_code == 200
    assert len(detail_with_sites.json()["sites"]) == 1

    listed_with_site = pg_client.get("/projects", headers=pg_auth_headers)
    assert listed_with_site.status_code == 200
    assert listed_with_site.json()[0]["site_count"] == 1

    site_detail = pg_client.get(f"/sites/{site_id}", headers=pg_auth_headers)
    assert site_detail.status_code == 200
    assert site_detail.json()["name"] == "Plot A"

    metrics = pg_client.get(f"/sites/{site_id}/metrics", headers=pg_auth_headers)
    assert metrics.status_code == 200
    assert metrics.json()["site_id"] == site_id
    assert metrics.json()["count"] == 0


def test_invalid_polygon_rejected(pg_client, pg_auth_headers):
    project_id = pg_client.post(
        "/projects",
        headers=pg_auth_headers,
        json={"name": "Validation Project"},
    ).json()["id"]

    response = pg_client.post(
        f"/projects/{project_id}/sites",
        headers=pg_auth_headers,
        json={"name": "Bad Plot", "geometry": INVALID_POLYGON},
    )
    assert response.status_code == 422


def test_cannot_access_other_users_project(pg_client, pg_auth_headers):
    project_id = pg_client.post(
        "/projects",
        headers=pg_auth_headers,
        json={"name": "Private Project"},
    ).json()["id"]

    other_headers = _register_second_user(pg_client, "other-user@example.com")
    forbidden = pg_client.get(f"/projects/{project_id}", headers=other_headers)
    assert forbidden.status_code == 404

    missing = pg_client.get(f"/projects/{uuid4()}", headers=pg_auth_headers)
    assert missing.status_code == 404


def test_unauthenticated_requests_rejected(pg_client):
    assert pg_client.get("/projects").status_code == 401
    assert pg_client.post("/projects", json={"name": "No Auth"}).status_code == 401


def test_site_metrics_after_seed(pg_client, pg_auth_headers, pg_db_session):
    project_id = pg_client.post(
        "/projects",
        headers=pg_auth_headers,
        json={"name": "Metrics Demo Project"},
    ).json()["id"]
    site_id = pg_client.post(
        f"/projects/{project_id}/sites",
        headers=pg_auth_headers,
        json={"name": "Seeded Plot", "geometry": VALID_POLYGON},
    ).json()["id"]

    site = pg_db_session.query(Site).filter(Site.id == site_id).one()
    created = seed_site_metrics(pg_db_session, site, replace=False, seed=42)
    assert created == 24

    all_metrics = pg_client.get(f"/sites/{site_id}/metrics", headers=pg_auth_headers)
    assert all_metrics.status_code == 200
    body = all_metrics.json()
    assert body["count"] == 24

    carbon_only = pg_client.get(
        f"/sites/{site_id}/metrics",
        headers=pg_auth_headers,
        params={"metric_type": "carbon_sequestration_tco2e"},
    )
    assert carbon_only.status_code == 200
    assert carbon_only.json()["count"] == 12
