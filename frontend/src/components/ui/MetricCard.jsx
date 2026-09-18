const TREND_TONES = {
  up: "metric-card-trend-up",
  water: "metric-card-trend-water",
  loam: "metric-card-trend-loam",
};

export default function MetricCard({ label, value, hint, icon, trend, className = "" }) {
  return (
    <article className={`metric-card ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <p className="metric-card-label">{label}</p>
        {icon && <span className="text-silt">{icon}</span>}
      </div>
      <p className="metric-card-value">{value}</p>
      {hint && <p className="metric-card-hint">{hint}</p>}
      {trend?.label && (
        <p className={`metric-card-trend ${TREND_TONES[trend.tone] ?? TREND_TONES.up}`}>
          {trend.label}
        </p>
      )}
    </article>
  );
}
