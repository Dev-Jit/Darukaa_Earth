import { useState } from "react";
import FormField from "./FormField.jsx";
import Modal from "./Modal.jsx";
import { createProject } from "../api/projects.js";
import { getApiErrorMessage } from "../utils/apiError.js";

export default function CreateProjectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setDescription("");
    setError("");
    setSubmitting(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || null,
      });
      resetForm();
      onCreated(project);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create project"));
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Create project" onClose={handleClose}>
      <form onSubmit={handleSubmit} noValidate>
        <FormField id="project-name" label="Name">
          <input
            id="project-name"
            type="text"
            required
            minLength={2}
            maxLength={255}
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input-field"
            placeholder="Western Ghats Restoration"
          />
        </FormField>
        <FormField id="project-description" label="Description (optional)">
          <textarea
            id="project-description"
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="input-field"
            placeholder="Brief summary of conservation goals"
          />
        </FormField>
        {error && (
          <p
            className="mb-4 rounded-[var(--radius-ui)] bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || name.trim().length < 2}
            className="btn-primary"
          >
            {submitting ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
