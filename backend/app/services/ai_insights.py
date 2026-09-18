from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings
from app.models.site import Site
from app.models.site_metric import SiteMetric
from app.schemas.ai_insights import SiteAiInsightsResponse

logger = logging.getLogger(__name__)

CARBON_METRIC_TYPE = "carbon_sequestration_tco2e"
BIODIVERSITY_METRIC_TYPE = "biodiversity_index"

SYSTEM_PROMPT = """You analyze existing site monitoring time series for a conservation dashboard.

Rules you must follow:
- Use only the JSON payload provided in the user message.
- Never invent measurements or timestamps.
- Never invent events such as fires, logging, rainfall, drought, disease, or restoration work.
- Do not claim that a metric proves ecological damage or ecological success.
- Distinguish observed patterns in the numbers from possible explanations.
- If the data is insufficient to determine a cause, say that explicitly.
- Use cautious language such as "may indicate", "could warrant investigation", or "the data shows".
- Do not present the output as a scientific diagnosis.

Return a JSON object with exactly these keys:
- summary: 2–3 sentences describing the site's current condition from the provided values.
- key_findings: an array of 2–3 short bullet strings describing important patterns.
- attention: if the data shows a notable decline, unusual fluctuation, or other pattern
  worth investigating, describe it. If nothing is notable, say so.
- suggested_next_step: one practical investigation or review step based only on
  the available data.
"""


class AiInsightsUnavailableError(Exception):
    """Raised when the AI provider cannot produce a usable insight."""


class AiInsightsNotConfiguredError(AiInsightsUnavailableError):
    """Raised when no AI provider credentials are configured."""


def percent_change(latest: float | None, previous: float | None) -> float | None:
    if latest is None or previous is None:
        return None
    if previous == 0:
        return 0.0 if latest == 0 else None
    return ((latest - previous) / previous) * 100


def _sorted_series(metrics: list[SiteMetric], metric_type: str) -> list[SiteMetric]:
    series = [metric for metric in metrics if metric.metric_type == metric_type]
    return sorted(series, key=lambda metric: metric.recorded_at)


def _iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.isoformat()


def _point(metric: SiteMetric | None) -> dict[str, Any] | None:
    if metric is None:
        return None
    return {"value": metric.value, "recorded_at": _iso(metric.recorded_at)}


def build_insight_payload(site: Site, metrics: list[SiteMetric]) -> dict[str, Any] | None:
    carbon = _sorted_series(metrics, CARBON_METRIC_TYPE)
    biodiversity = _sorted_series(metrics, BIODIVERSITY_METRIC_TYPE)
    if not carbon and not biodiversity:
        return None

    carbon_latest = carbon[-1] if carbon else None
    carbon_previous = carbon[-2] if len(carbon) > 1 else None
    biodiversity_latest = biodiversity[-1] if biodiversity else None
    biodiversity_previous = biodiversity[-2] if len(biodiversity) > 1 else None

    return {
        "site_name": site.name,
        "carbon": {
            "metric_type": CARBON_METRIC_TYPE,
            "unit": "tCO2e",
            "latest_value": carbon_latest.value if carbon_latest else None,
            "previous_value": carbon_previous.value if carbon_previous else None,
            "percent_change": percent_change(
                carbon_latest.value if carbon_latest else None,
                carbon_previous.value if carbon_previous else None,
            ),
            "latest": _point(carbon_latest),
            "previous": _point(carbon_previous),
            "time_series": [_point(metric) for metric in carbon],
        },
        "biodiversity": {
            "metric_type": BIODIVERSITY_METRIC_TYPE,
            "unit": "index_0_to_1",
            "latest_value": biodiversity_latest.value if biodiversity_latest else None,
            "previous_value": biodiversity_previous.value if biodiversity_previous else None,
            "percent_change": percent_change(
                biodiversity_latest.value if biodiversity_latest else None,
                biodiversity_previous.value if biodiversity_previous else None,
            ),
            "latest": _point(biodiversity_latest),
            "previous": _point(biodiversity_previous),
            "time_series": [_point(metric) for metric in biodiversity],
        },
    }


def _extract_json_object(content: str) -> dict[str, Any]:
    text = content.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise AiInsightsUnavailableError("AI provider returned invalid JSON") from exc
    if not isinstance(parsed, dict):
        raise AiInsightsUnavailableError("AI provider returned a non-object JSON payload")
    return parsed


def _normalize_findings(raw: Any) -> list[str]:
    if not isinstance(raw, list):
        return []
    findings: list[str] = []
    for item in raw:
        if isinstance(item, str) and item.strip():
            findings.append(item.strip())
        if len(findings) == 3:
            break
    return findings


def parse_insight_response(content: str) -> SiteAiInsightsResponse:
    parsed = _extract_json_object(content)
    summary = parsed.get("summary")
    attention = parsed.get("attention")
    next_step = parsed.get("suggested_next_step")
    findings = _normalize_findings(parsed.get("key_findings"))
    if not isinstance(summary, str) or not summary.strip():
        raise AiInsightsUnavailableError("AI response missing summary")
    if len(findings) < 2:
        raise AiInsightsUnavailableError("AI response missing key findings")
    if not isinstance(attention, str) or not attention.strip():
        raise AiInsightsUnavailableError("AI response missing attention")
    if not isinstance(next_step, str) or not next_step.strip():
        raise AiInsightsUnavailableError("AI response missing suggested next step")
    return SiteAiInsightsResponse(
        status="ok",
        summary=summary.strip(),
        key_findings=findings,
        attention=attention.strip(),
        suggested_next_step=next_step.strip(),
    )


def _chat_completions_url() -> str:
    return settings.GROQ_BASE_URL.rstrip("/") + "/chat/completions"


def complete_json(payload: dict[str, Any]) -> str:
    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        raise AiInsightsNotConfiguredError("GROQ_API_KEY is not configured")

    body = {
        "model": settings.GROQ_MODEL,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Analyze this site monitoring payload and return a JSON object "
                    "with keys summary, key_findings, attention, and suggested_next_step.\n\n"
                    + json.dumps(payload, default=str)
                ),
            },
        ],
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    try:
        response = httpx.post(
            _chat_completions_url(),
            json=body,
            headers=headers,
            timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
        )
        if response.is_error:
            logger.error(
                "Groq chat completions failed: status=%s body=%s",
                response.status_code,
                response.text[:500],
            )
            response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
    except AiInsightsUnavailableError:
        raise
    except (httpx.HTTPError, KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        logger.exception("Groq insight request failed")
        raise AiInsightsUnavailableError("AI provider request failed") from exc
    if not isinstance(content, str) or not content.strip():
        raise AiInsightsUnavailableError("AI provider returned an empty response")
    return content


def generate_site_insights(site: Site, metrics: list[SiteMetric]) -> SiteAiInsightsResponse:
    payload = build_insight_payload(site, metrics)
    if payload is None:
        return SiteAiInsightsResponse(status="no_data")
    content = complete_json(payload)
    return parse_insight_response(content)
