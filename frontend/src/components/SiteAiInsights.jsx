import { useCallback, useEffect, useState } from "react";
import { fetchSiteAiInsights } from "../api/sites.js";
import Button from "./ui/Button.jsx";
import Card from "./ui/Card.jsx";
import LoadingState from "./ui/LoadingState.jsx";

function InsightBlock({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-bark">{title}</h3>
      <div className="mt-1 text-sm text-bark">{children}</div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-4 w-28 animate-pulse rounded bg-canopy-soft" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-canopy-soft" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-canopy-soft" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-canopy-soft" />
      </div>
      <div className="h-4 w-24 animate-pulse rounded bg-canopy-soft" />
      <div className="space-y-2">
        <div className="h-3 w-4/5 animate-pulse rounded bg-canopy-soft" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-canopy-soft" />
      </div>
    </div>
  );
}

export default function SiteAiInsights({ siteId }) {
  const [status, setStatus] = useState("loading");
  const [insight, setInsight] = useState(null);

  const loadInsights = useCallback(async () => {
    setStatus("loading");
    setInsight(null);
    try {
      const data = await fetchSiteAiInsights(siteId);
      if (data.status === "no_data") {
        setStatus("no_data");
        return;
      }
      setInsight(data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [siteId]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return (
    <section className="mt-8" aria-labelledby="ai-site-insights-heading">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="ai-site-insights-heading" className="section-title">
              AI Site Insights
            </h2>
            <p className="caption mt-1">Generated from site monitoring data</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadInsights}
            disabled={status === "loading"}
          >
            Refresh insight
          </Button>
        </div>

        <div className="mt-5">
          {status === "loading" && (
            <div role="status" aria-live="polite">
              <LoadingState message="Generating site insights…" />
              <div className="mt-4">
                <InsightsSkeleton />
              </div>
            </div>
          )}

          {status === "error" && (
            <p className="text-sm text-silt" role="alert">
              AI insights are currently unavailable.
            </p>
          )}

          {status === "no_data" && (
            <p className="text-sm text-silt">
              Insights will appear once carbon or biodiversity observations are recorded for this
              site.
            </p>
          )}

          {status === "success" && insight && (
            <div className="space-y-5">
              <InsightBlock title="AI Summary">
                <p>{insight.summary}</p>
              </InsightBlock>

              <InsightBlock title="Key Findings">
                <ul className="list-disc space-y-1 pl-5">
                  {insight.key_findings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
              </InsightBlock>

              <InsightBlock title="Attention">
                <p>{insight.attention}</p>
              </InsightBlock>

              <InsightBlock title="Suggested Next Step">
                <p>{insight.suggested_next_step}</p>
              </InsightBlock>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}
