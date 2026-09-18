import Breadcrumbs from "./Breadcrumbs.jsx";

export default function AppHeader({ crumbs = [], leading, children }) {
  return (
    <header className="app-header">
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <Breadcrumbs items={crumbs} />
      </div>
      {children && <div className="header-tools">{children}</div>}
    </header>
  );
}
