import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import AppHeader from "./ui/AppHeader.jsx";
import Button from "./ui/Button.jsx";
import Sidebar from "./ui/Sidebar.jsx";
import { MenuIcon } from "./ui/icons.jsx";

const NAV_SECTIONS = [
  {
    label: "Operational units",
    items: [{ to: "/dashboard", label: "Overview", icon: "overview", end: true }],
  },
];

function crumbsFromPath(pathname) {
  if (pathname.startsWith("/sites/")) {
    return [{ label: "Portfolio", to: "/dashboard" }, { label: "Site" }];
  }
  if (pathname.startsWith("/projects/")) {
    return [{ label: "Portfolio", to: "/dashboard" }, { label: "Project" }];
  }
  return [{ label: "Portfolio" }, { label: "Overview" }];
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const crumbs = useMemo(() => crumbsFromPath(pathname), [pathname]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const sidebar = (
    <Sidebar
      sections={NAV_SECTIONS}
      user={user}
      footerAction={
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start px-0"
        >
          Log out
        </Button>
      }
    />
  );

  return (
    <div className="app-shell">
      <div className="hidden lg:block">{sidebar}</div>

      {navOpen && (
        <>
          <button
            type="button"
            className="sidebar-overlay"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          />
          <div className="sidebar-drawer">{sidebar}</div>
        </>
      )}

      <div className="app-shell-main">
        <AppHeader
          crumbs={crumbs}
          leading={
            <Button
              variant="icon"
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setNavOpen(true)}
            >
              <MenuIcon />
            </Button>
          }
        />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
