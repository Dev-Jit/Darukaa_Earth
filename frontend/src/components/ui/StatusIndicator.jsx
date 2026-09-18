const TONES = {
  monitoring: "status-dot-monitoring",
  verification: "status-dot-verification",
  water: "status-dot-water",
  idle: "status-dot-idle",
};

export default function StatusIndicator({ tone = "monitoring", label, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm text-bark ${className}`.trim()}>
      <span className={`status-dot ${TONES[tone] ?? TONES.idle}`} aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  );
}
