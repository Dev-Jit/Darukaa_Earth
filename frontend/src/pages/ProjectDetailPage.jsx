import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProject } from "../api/projects.js";
import ProjectSitesMap from "../components/ProjectSitesMap.jsx";
import { getApiErrorMessage } from "../utils/apiError.js";
import { formatDate } from "../utils/formatDate.js";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProject(id);
      setProject(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load project"));
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  return (
    <div>
      <Link to="/dashboard" className="link-back">
        ← Back to dashboard
      </Link>

      {loading && (
        <div className="surface mt-8 flex items-center justify-center py-16">
          <p className="caption">Loading project…</p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-[var(--radius-ui)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadProject}
            className="mt-2 font-medium text-red-800 underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-loam"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && project && (
        <>
          <header className="mt-4">
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p className="page-description">{project.description}</p>}
            <dl className="page-meta space-y-1">
              <div>
                <dt className="sr-only">Created</dt>
                <dd>Created {formatDate(project.created_at)}</dd>
              </div>
              <div>
                <dt className="sr-only">Sites</dt>
                <dd>
                  {project.sites.length} site
                  {project.sites.length === 1 ? "" : "s"}
                </dd>
              </div>
            </dl>
          </header>

          <section className="mt-8">
            <h2 className="section-title">Site boundaries</h2>
            <div className="mt-4">
              <ProjectSitesMap
                projectId={project.id}
                sites={project.sites}
                onSiteCreated={loadProject}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
