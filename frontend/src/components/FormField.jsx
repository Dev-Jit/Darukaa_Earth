export default function FormField({ id, label, error, children }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
