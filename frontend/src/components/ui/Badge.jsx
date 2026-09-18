const VARIANTS = {
  monitoring: "badge-monitoring",
  verification: "badge-verification",
  water: "badge-water",
  neutral: "badge-neutral",
};

const DOTS = {
  monitoring: "status-dot-monitoring",
  verification: "status-dot-verification",
  water: "status-dot-water",
  neutral: "status-dot-idle",
};

export default function Badge({ variant = "neutral", dot = false, children, className = "" }) {
  return (
    <span className={`badge ${VARIANTS[variant] ?? VARIANTS.neutral} ${className}`.trim()}>
      {dot && <span className={`status-dot ${DOTS[variant] ?? DOTS.neutral}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
