export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h2 className="font-heading text-base font-semibold text-bark">{title}</h2>
      {description && <p className="caption mt-2">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
