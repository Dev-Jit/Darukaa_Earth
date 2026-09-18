export default function SiteKpiCard({ label, value, unit, hint, tooltip, children }) {
  return (
    <article className="metric-card" aria-label={label}>
      <div className="flex items-start justify-between gap-2">
        <p className="metric-card-label">{label}</p>
        {tooltip && (
          <span className="kpi-info" tabIndex={0} title={tooltip} aria-label={tooltip}>
            i
          </span>
        )}
      </div>
      <p className="metric-card-value">
        <span>{value}</span>
        {unit && <span className="metric-card-unit">{unit}</span>}
      </p>
      {hint && <p className="metric-card-hint">{hint}</p>}
      {children}
    </article>
  );
}
