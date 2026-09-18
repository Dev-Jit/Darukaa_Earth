export const METRIC_TYPES = {
  CARBON: "carbon_sequestration_tco2e",
  BIODIVERSITY: "biodiversity_index",
};

export function metricsByType(metrics, metricType) {
  return metrics
    .filter((metric) => metric.metric_type === metricType)
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
}

export function toChartSeries(metrics) {
  return metrics.map((metric) => [new Date(metric.recorded_at).getTime(), metric.value]);
}

export function hasMetricsForTypes(metrics, types) {
  return types.some((type) => metrics.some((metric) => metric.metric_type === type));
}

export function getLatestAndPrevious(metrics) {
  if (!metrics?.length) {
    return { latest: null, previous: null };
  }

  const sorted = [...metrics].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  return {
    latest: sorted[sorted.length - 1],
    previous: sorted.length > 1 ? sorted[sorted.length - 2] : null,
  };
}

/** ((latest - previous) / previous) * 100. Returns null when previous is 0 or data is missing. */
export function percentChange(latestValue, previousValue) {
  if (!Number.isFinite(latestValue) || !Number.isFinite(previousValue)) {
    return null;
  }
  if (previousValue === 0) {
    return latestValue === 0 ? 0 : null;
  }
  return ((latestValue - previousValue) / previousValue) * 100;
}

export function trendDirection(change) {
  if (!Number.isFinite(change)) {
    return null;
  }
  if (change > 0) {
    return "up";
  }
  if (change < 0) {
    return "down";
  }
  return "flat";
}

export function latestRecordedAt(metrics) {
  if (!metrics?.length) {
    return null;
  }

  return metrics.reduce((latest, metric) => {
    const current = new Date(metric.recorded_at).getTime();
    if (Number.isNaN(current)) {
      return latest;
    }
    if (latest == null || current > latest) {
      return current;
    }
    return latest;
  }, null);
}

export function summarizeMetricSeries(metrics) {
  const { latest, previous } = getLatestAndPrevious(metrics);
  const change = percentChange(latest?.value, previous?.value);

  return {
    latest,
    previous,
    value: Number.isFinite(latest?.value) ? latest.value : null,
    recordedAt: latest?.recorded_at ?? null,
    percentChange: change,
    direction: trendDirection(change),
  };
}
