export default function LoadingState({ message = "Loading…" }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-bar">
        <div className="loading-bar-fill" />
      </div>
      <p className="caption">{message}</p>
    </div>
  );
}
