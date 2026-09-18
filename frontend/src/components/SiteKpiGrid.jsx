import SiteKpiCard from "./SiteKpiCard.jsx";
import TrendIndicator from "./TrendIndicator.jsx";
import { computeEnvironmentalHealthScore } from "../utils/environmentalHealth.js";
import { formatDate, formatRelativeDate } from "../utils/formatDate.js";
import {
  METRIC_TYPES,
  metricsByType,
  summarizeMetricSeries,
  latestRecordedAt,
} from "../utils/metrics.js";

function formatNumber(value, decimals) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPercentLabel(change) {
  if (!Number.isFinite(change)) {
    return null;
  }
  return `${Math.abs(change).toFixed(1)}%`;
}

function comparisonHint(summary) {
  if (!summary.previous) {
    return "Needs at least two observations";
  }
  if (summary.percentChange == null) {
    return "Change unavailable (previous value is 0)";
  }
  return `Compared with ${formatDate(summary.previous.recorded_at)}`;
}

export default function SiteKpiGrid({ metrics }) {
  const carbon = summarizeMetricSeries(metricsByType(metrics, METRIC_TYPES.CARBON));
  const biodiversity = summarizeMetricSeries(metricsByType(metrics, METRIC_TYPES.BIODIVERSITY));
  const healthScore = computeEnvironmentalHealthScore({
    carbonLatest: carbon.value,
    biodiversityLatest: biodiversity.value,
  });
  const lastObserved = latestRecordedAt(metrics);

  return (
    <section className="mt-8" aria-labelledby="site-overview-heading">
      <h2 id="site-overview-heading" className="section-title">
        Site overview
      </h2>
      <p className="page-description mt-2">
        Latest observations from the site metric series, with change versus the previous reading.
      </p>

      <div className="kpi-grid mt-4">
        <SiteKpiCard
          label="Carbon sequestration"
          value={formatNumber(carbon.value, 2)}
          unit={carbon.value != null ? "tCO₂e" : null}
          hint={
            carbon.value != null
              ? `Latest observation ${formatDate(carbon.recordedAt)}`
              : "No carbon observations recorded"
          }
          tooltip="Latest carbon sequestration value from the site metrics series, compared with the previous observation."
        >
          <TrendIndicator
            direction={carbon.direction}
            percentLabel={formatPercentLabel(carbon.percentChange)}
            comparisonLabel={comparisonHint(carbon)}
          />
        </SiteKpiCard>

        <SiteKpiCard
          label="Biodiversity index"
          value={formatNumber(biodiversity.value, 3)}
          hint={
            biodiversity.value != null
              ? `Latest observation ${formatDate(biodiversity.recordedAt)}`
              : "No biodiversity observations recorded"
          }
          tooltip="Latest biodiversity index (0–1) from the site metrics series, compared with the previous observation."
        >
          <TrendIndicator
            direction={biodiversity.direction}
            percentLabel={formatPercentLabel(biodiversity.percentChange)}
            comparisonLabel={comparisonHint(biodiversity)}
          />
        </SiteKpiCard>

        <SiteKpiCard
          label="Environmental health"
          value={healthScore == null ? "—" : String(healthScore)}
          unit={healthScore == null ? null : "/ 100"}
          hint={
            healthScore == null
              ? "Score unavailable until observations exist"
              : "Interim score from latest carbon and biodiversity readings"
          }
          tooltip="Placeholder 0–100 score. Replace computeEnvironmentalHealthScore to use the final model."
        />

        <SiteKpiCard
          label="Last monitoring"
          value={formatDate(lastObserved)}
          hint={
            lastObserved != null
              ? formatRelativeDate(lastObserved)
              : "No metric observations recorded"
          }
          tooltip="Date of the most recent carbon or biodiversity observation for this site."
        />
      </div>
    </section>
  );
}
