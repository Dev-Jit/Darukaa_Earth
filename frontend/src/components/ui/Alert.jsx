const TONES = {
  danger: "alert-danger",
  warning: "alert-warning",
  info: "alert-info",
};

export default function Alert({ tone = "danger", children, className = "" }) {
  return (
    <div className={`alert ${TONES[tone] ?? TONES.danger} ${className}`.trim()} role="alert">
      {children}
    </div>
  );
}
