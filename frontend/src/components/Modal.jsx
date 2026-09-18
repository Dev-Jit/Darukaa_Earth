import { useEffect } from "react";

export default function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close dialog"
        className="modal-backdrop"
        onClick={onClose}
      />
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="modal-panel">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="section-title">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-ui)] p-1 text-silt hover:bg-mist hover:text-bark focus-ring"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
