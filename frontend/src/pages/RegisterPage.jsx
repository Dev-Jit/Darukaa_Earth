import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { getApiErrorMessage } from "../utils/apiError.js";

export default function RegisterPage() {
  const { register, isAuthenticated, initializing } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register({ name, email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Registration failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="section-title mb-2">Create account</h1>
      <p className="caption mb-6">Password: at least 8 characters, with a letter and a number.</p>
      <form onSubmit={handleSubmit} noValidate>
        <FormField id="name" label="Full name">
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </FormField>
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
            autoComplete="new-password"
            required
            minLength={8}
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
          {submitting ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="caption mt-6 text-center">
        Already have an account?{" "}
        <Link to="/login" className="link-accent">
          Sign in
        </Link>
      </p>
    </>
  );
}
