import { NavLink } from "react-router-dom";
import BrandMark from "./BrandMark.jsx";
import {
  AnalyticsIcon,
  MethodologyIcon,
  MonitoringIcon,
  OverviewIcon,
  ProjectsIcon,
  SettingsIcon,
} from "./icons.jsx";

const NAV_ICONS = {
  overview: OverviewIcon,
  projects: ProjectsIcon,
  monitoring: MonitoringIcon,
  analytics: AnalyticsIcon,
  settings: SettingsIcon,
  methodology: MethodologyIcon,
};

function initialsFromUser(user) {
  const source = user?.name?.trim() || user?.email || "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "DE";
}

export default function Sidebar({ sections, items = [], user, footerAction, className = "" }) {
  const resolvedSections =
    sections ??
    (items.length
      ? [
          {
            label: "Operational units",
            items,
          },
        ]
      : []);

  return (
    <aside className={`sidebar ${className}`.trim()}>
      <div className="border-b border-edge px-4 py-5">
        <NavLink to="/dashboard" className="brand-lockup focus-ring rounded-[var(--radius-ui)]">
          <BrandMark size={32} />
          <span>
            <span className="brand-name block">Darukaa.Earth</span>
            <span className="brand-tagline block">Conservation Intelligence</span>
          </span>
        </NavLink>
      </div>

      <nav className="flex-1 px-3 py-5" aria-label="Primary">
        {resolvedSections.map((section) => (
          <div key={section.label ?? "nav"} className="nav-section">
            {section.label && <p className="nav-section-label">{section.label}</p>}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon ? NAV_ICONS[item.icon] : null;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? "nav-item-active" : ""}`.trim()
                      }
                    >
                      {Icon && <Icon />}
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-edge px-4 py-4">
        {user && (
          <div className="sidebar-user mb-3">
            <span className="sidebar-avatar" aria-hidden="true">
              {initialsFromUser(user)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-bark">{user.name}</p>
              <p className="truncate text-[0.75rem] text-silt">{user.email}</p>
            </div>
          </div>
        )}
        {footerAction}
      </div>
    </aside>
  );
}
