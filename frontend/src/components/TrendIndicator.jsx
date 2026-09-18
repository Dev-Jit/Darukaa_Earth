const DIRECTION_COPY = {
  up: { word: "Up", arrow: "↑" },
  down: { word: "Down", arrow: "↓" },
  flat: { word: "Unchanged", arrow: "→" },
};

const DIRECTION_CLASS = {
  up: "kpi-trend-up",
  down: "kpi-trend-down",
  flat: "kpi-trend-flat",
};

export default function TrendIndicator({ direction, percentLabel, comparisonLabel }) {
  if (!direction) {
    const fallback = comparisonLabel ?? "No prior observation to compare";
    return (
      <p className="metric-card-trend kpi-trend-flat" aria-label={fallback}>
        <span aria-hidden="true">{fallback}</span>
      </p>
    );
  }

  const copy = DIRECTION_COPY[direction] ?? DIRECTION_COPY.flat;
  const visibleLabel =
    direction === "flat" ? copy.word : percentLabel ? `${copy.word} ${percentLabel}` : copy.word;
  const accessibleLabel = comparisonLabel
    ? `${visibleLabel}. ${comparisonLabel}`
    : `${visibleLabel} versus the previous observation`;

  return (
    <p
      className={`metric-card-trend ${DIRECTION_CLASS[direction] ?? DIRECTION_CLASS.flat}`}
      aria-label={accessibleLabel}
    >
      <span aria-hidden="true">
        {copy.arrow} {visibleLabel}
      </span>
    </p>
  );
}
