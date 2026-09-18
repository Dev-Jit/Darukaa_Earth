export default function Chip({ active = false, count, children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`chip ${active ? "chip-active" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
      {count != null && <span className="chip-count">{count}</span>}
    </button>
  );
}
