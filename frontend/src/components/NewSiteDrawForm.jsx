import { useState } from "react";
import FormField from "./FormField.jsx";
import { createSite } from "../api/projects.js";
import { getApiErrorMessage } from "../utils/apiError.js";

export default function NewSiteDrawForm({ projectId, geometry, onCancel, onCreated }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await createSite(projectId, {
        name: name.trim(),
        geometry,
      });
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create site"));
      setSubmitting(false);
    }
  }

  return (
    <div className="surface absolute bottom-4 left-4 z-10 w-full max-w-sm p-4 shadow-lg">
      <h3 className="font-heading text-sm font-semibold text-bark">New site boundary</h3>
      <p className="caption mt-1">Name the polygon you drew, then save it to this project.</p>
      <form onSubmit={handleSubmit} className="mt-3" noValidate>
        <FormField id="site-name" label="Site name">
          <input
            id="site-name"
            type="text"
            required
            minLength={2}
            maxLength={255}
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input-field"
            placeholder="Plot A"
          />
        </FormField>
        {error && (
          <p
            className="mb-3 rounded-[var(--radius-ui)] bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="btn-secondary-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || name.trim().length < 2}
            className="btn-primary px-3 py-1.5"
          >
            {submitting ? "Saving…" : "Save site"}
          </button>
        </div>
      </form>
    </div>
  );
}
