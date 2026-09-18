import { Link, Outlet } from "react-router-dom";
import BrandMark from "./ui/BrandMark.jsx";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link to="/" className="brand-lockup focus-ring inline-flex rounded-[var(--radius-ui)]">
          <BrandMark size={36} />
          <span className="text-left">
            <span className="brand-name block text-lg">Darukaa.Earth</span>
            <span className="brand-tagline block">Conservation Intelligence</span>
          </span>
        </Link>
      </div>
      <div className="surface w-full max-w-md p-6">
        <Outlet />
      </div>
    </div>
  );
}
