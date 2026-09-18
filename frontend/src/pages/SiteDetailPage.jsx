import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSite, fetchSiteMetrics } from "../api/sites.js";
import EmptyState from "../components/EmptyState.jsx";
import SiteAiInsights from "../components/SiteAiInsights.jsx";
import SiteKpiGrid from "../components/SiteKpiGrid.jsx";
import SiteMetricChart from "../components/SiteMetricChart.jsx";
import SitePolygonMap from "../components/SitePolygonMap.jsx";
import { getApiErrorMessage } from "../utils/apiError.js";
import { formatDate } from "../utils/formatDate.js";
import {
  METRIC_TYPES,
  hasMetricsForTypes,
  metricsByType,
  toChartSeries,
} from "../utils/metrics.js";

export default function SiteDetailPage() {
  const { id } = useParams();
  const [site, setSite] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSiteDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [siteData, metricsData] = await Promise.all([fetchSite(id), fetchSiteMetrics(id)]);
      setSite(siteData);
      setMetrics(metricsData.metrics ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load site"));
      setSite(null);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSiteDetail();
  }, [loadSiteDetail]);

  const carbonMetrics = metricsByType(metrics, METRIC_TYPES.CARBON);
  const biodiversityMetrics = metricsByType(metrics, METRIC_TYPES.BIODIVERSITY);
  const hasAnyMetrics = hasMetricsForTypes(metrics, [
    METRIC_TYPES.CARBON,
    METRIC_TYPES.BIODIVERSITY,
  ]);

  return (
    <div>
      <Link to={site ? `/projects/${site.project_id}` : "/dashboard"} className="link-back">
        ← Back to project
      </Link>

      {loading && (
        <div className="surface mt-8 flex items-center justify-center py-16">
          <p className="caption">Loading site…</p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-[var(--radius-ui)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadSiteDetail}
            className="mt-2 font-medium text-red-800 underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-loam"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && site && (
        <>
          <header className="mt-4">
            <h1 className="page-title">{site.name}</h1>
            <dl className="page-meta space-y-1">
              <div>
                <dt className="sr-only">Created</dt>
                <dd>Created {formatDate(site.created_at)}</dd>
              </div>
              <div>
                <dt className="sr-only">Updated</dt>
                <dd>Updated {formatDate(site.updated_at)}</dd>
              </div>
            </dl>
          </header>

          <SiteKpiGrid metrics={metrics} />

          <SiteAiInsights siteId={id} />

          <section className="mt-8">
            <h2 className="section-title">Site boundary</h2>
            <div className="mt-3">
              <SitePolygonMap site={site} />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="section-title">Ecological metrics</h2>
            <p className="page-description mt-2">
              Time-series observations for carbon sequestration and biodiversity on this site.
            </p>

            {!hasAnyMetrics && (
              <div className="mt-4">
                <EmptyState
                  title="No metrics yet"
                  description="This site has no recorded observations. Seed demo data with the backend script or wait for ingestion pipelines to populate metrics."
                />
              </div>
            )}

            {hasAnyMetrics && (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {carbonMetrics.length > 0 ? (
                  <SiteMetricChart
                    title="Carbon sequestration"
                    seriesName="Carbon sequestration (tCO₂e)"
                    data={toChartSeries(carbonMetrics)}
                    yAxisTitle="tCO₂e"
                    valueSuffix=" tCO₂e"
                    valueDecimals={2}
                    variant="carbon"
                  />
                ) : (
                  <EmptyState
                    title="No carbon data"
                    description="Carbon sequestration readings have not been recorded for this site yet."
                  />
                )}

                {biodiversityMetrics.length > 0 ? (
                  <SiteMetricChart
                    title="Biodiversity index"
                    seriesName="Biodiversity index (0–1)"
                    data={toChartSeries(biodiversityMetrics)}
                    yAxisTitle="Index (0–1)"
                    valueDecimals={3}
                    chartType="line"
                    variant="biodiversity"
                  />
                ) : (
                  <EmptyState
                    title="No biodiversity data"
                    description="Biodiversity index readings have not been recorded for this site yet."
                  />
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
