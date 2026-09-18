import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { getApiErrorMessage } from "../utils/apiError.js";

export default function LoginPage() {
  const { login, isAuthenticated, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="section-title mb-6">Sign in</h1>
      <form onSubmit={handleSubmit} noValidate>
        <FormField id="email" label="Email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </FormField>
        <FormField id="password" label="Password">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
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
        <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="caption mt-6 text-center">
        No account?{" "}
        <Link to="/register" className="link-accent">
          Register
        </Link>
      </p>
    </>
  );
}
