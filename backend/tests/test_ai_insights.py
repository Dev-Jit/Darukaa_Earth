import json
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from app.models.site import Site
from app.services.ai_insights import (
    build_insight_payload,
    parse_insight_response,
    percent_change,
)
from scripts.seed_site_metrics import seed_site_metrics

from conftest import VALID_POLYGON


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


def _create_site(pg_client, headers, name="Insight Plot") -> str:
    project_id = pg_client.post(
        "/projects",
        headers=headers,
        json={"name": "Insight Project"},
    ).json()["id"]
    return pg_client.post(
        f"/projects/{project_id}/sites",
        headers=headers,
        json={"name": name, "geometry": VALID_POLYGON},
    ).json()["id"]


def test_percent_change_matches_dashboard_formula():
    assert percent_change(110, 100) == 10
    assert percent_change(0, 0) == 0
    assert percent_change(5, 0) is None
    assert percent_change(None, 10) is None


def test_build_insight_payload_includes_series_and_latest_change():
    site = SimpleNamespace(name="Plot A")
    carbon_old = SimpleNamespace(
        metric_type="carbon_sequestration_tco2e",
        value=10.0,
        recorded_at=datetime(2026, 1, 1, tzinfo=UTC),
    )
    carbon_new = SimpleNamespace(
        metric_type="carbon_sequestration_tco2e",
        value=12.0,
        recorded_at=datetime(2026, 2, 1, tzinfo=UTC),
    )
    payload = build_insight_payload(site, [carbon_new, carbon_old])
    assert payload["site_name"] == "Plot A"
    assert payload["carbon"]["latest_value"] == 12.0
    assert payload["carbon"]["previous_value"] == 10.0
    assert payload["carbon"]["percent_change"] == 20.0
    assert len(payload["carbon"]["time_series"]) == 2
    assert payload["biodiversity"]["latest_value"] is None


def test_parse_insight_response_strips_fenced_json():
    content = """```json
    {
      "summary": "The data shows a modest rise in carbon readings.",
      "key_findings": [
        "Carbon increased versus the previous observation.",
        "Biodiversity has too few points to compare."
      ],
      "attention": "Nothing notable beyond the latest carbon increase.",
      "suggested_next_step": "Review the two most recent carbon observations."
    }
    ```"""
    parsed = parse_insight_response(content)
    assert parsed.status == "ok"
    assert parsed.summary.startswith("The data shows")
    assert len(parsed.key_findings) == 2


def test_ai_insights_unauthenticated(pg_client):
    assert pg_client.get(f"/sites/{uuid4()}/ai-insights").status_code == 401


def test_ai_insights_no_data(pg_client, pg_auth_headers):
    site_id = _create_site(pg_client, pg_auth_headers)
    response = pg_client.get(f"/sites/{site_id}/ai-insights", headers=pg_auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "no_data"


def test_ai_insights_hidden_from_other_users(pg_client, pg_auth_headers):
    site_id = _create_site(pg_client, pg_auth_headers)
    other_headers = _register_second_user(pg_client, "other-insights@example.com")
    forbidden = pg_client.get(f"/sites/{site_id}/ai-insights", headers=other_headers)
    assert forbidden.status_code == 404


def test_ai_insights_success_with_mocked_provider(pg_client, pg_auth_headers, pg_db_session):
    site_id = _create_site(pg_client, pg_auth_headers, name="Seeded Insight Plot")
    site = pg_db_session.query(Site).filter(Site.id == site_id).one()
    seed_site_metrics(pg_db_session, site, replace=False, seed=7)

    provider_json = json.dumps(
        {
            "summary": "The data shows carbon and biodiversity readings across a 12-month series.",
            "key_findings": [
                "Latest carbon differs from the previous observation.",
                "Biodiversity remains within the recorded index range.",
                "Both series have enough points to compare latest versus previous values.",
            ],
            "attention": "Nothing in the provided series is clearly anomalous.",
            "suggested_next_step": "Compare the latest two observations in each series.",
        }
    )

    with patch("app.services.ai_insights.complete_json", return_value=provider_json):
        response = pg_client.get(f"/sites/{site_id}/ai-insights", headers=pg_auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "carbon and biodiversity" in body["summary"]
    assert len(body["key_findings"]) == 3
    assert body["attention"]
    assert body["suggested_next_step"]


def test_ai_insights_missing_key_returns_503(pg_client, pg_auth_headers, pg_db_session):
    site_id = _create_site(pg_client, pg_auth_headers)
    site = pg_db_session.query(Site).filter(Site.id == site_id).one()
    seed_site_metrics(pg_db_session, site, replace=False, seed=5)

    with patch("app.services.ai_insights.settings") as mock_settings:
        mock_settings.GROQ_API_KEY = ""
        mock_settings.GROQ_MODEL = "openai/gpt-oss-120b"
        mock_settings.GROQ_BASE_URL = "https://api.groq.com/openai/v1"
        mock_settings.AI_REQUEST_TIMEOUT_SECONDS = 30
        response = pg_client.get(f"/sites/{site_id}/ai-insights", headers=pg_auth_headers)

    assert response.status_code == 503
    assert response.json()["detail"] == "AI insights are currently unavailable."


def test_ai_insights_service_error_returns_503(pg_client, pg_auth_headers, pg_db_session):
    from app.services.ai_insights import AiInsightsUnavailableError

    site_id = _create_site(pg_client, pg_auth_headers)
    site = pg_db_session.query(Site).filter(Site.id == site_id).one()
    seed_site_metrics(pg_db_session, site, replace=False, seed=4)

    with patch(
        "app.api.v1.endpoints.sites.generate_site_insights",
        side_effect=AiInsightsUnavailableError("provider down"),
    ):
        response = pg_client.get(f"/sites/{site_id}/ai-insights", headers=pg_auth_headers)

    assert response.status_code == 503
    assert response.json()["detail"] == "AI insights are currently unavailable."
