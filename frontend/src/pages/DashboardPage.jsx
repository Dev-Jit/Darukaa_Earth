import { useCallback, useState } from "react";
import { fetchProjects } from "../api/projects.js";
import CreateProjectModal from "../components/CreateProjectModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import { useResourceList } from "../hooks/useResourceList.js";

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const loadProjects = useCallback(() => fetchProjects(), []);
  const {
    items: projects,
    loading,
    error,
    reload,
  } = useResourceList(loadProjects, {
    errorFallback: "Could not load projects",
  });

  function handleProjectCreated() {
    reload();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <header>
          <h1 className="page-title">Projects</h1>
          <p className="page-description">
            Manage conservation projects and their monitoring sites.
          </p>
        </header>
        <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
          Create project
        </button>
      </div>

      {loading && (
        <div className="surface mt-8 flex items-center justify-center py-16">
          <p className="caption">Loading projects…</p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-[var(--radius-ui)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-2 font-medium text-red-800 underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-loam"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No projects yet"
            description="Create your first conservation project to start adding monitoring sites."
            action={
              <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
                Create your first project
              </button>
            }
          />
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}
