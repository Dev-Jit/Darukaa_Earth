import { Link } from "react-router-dom";
import { formatDate } from "../utils/formatDate.js";

function siteCountLabel(count) {
  if (count === 1) {
    return "1 site";
  }
  return `${count} sites`;
}

export default function ProjectCard({ project }) {
  const description = project.description?.trim() || "No description yet.";

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col surface p-5 transition hover:border-canopy/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-loam focus-visible:ring-offset-2"
    >
      <h3 className="font-heading text-base font-semibold text-bark group-hover:text-canopy">
        {project.name}
      </h3>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-bark">{description}</p>
      <dl className="caption mt-4 space-y-1 border-t border-edge pt-4">
        <div>
          <dt className="sr-only">Sites</dt>
          <dd>{siteCountLabel(project.site_count ?? 0)}</dd>
        </div>
        <div>
          <dt className="sr-only">Created</dt>
          <dd>Created {formatDate(project.created_at)}</dd>
        </div>
      </dl>
    </Link>
  );
}
