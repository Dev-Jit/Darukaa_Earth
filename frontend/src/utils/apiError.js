export function getApiErrorMessage(error, fallback = "Something went wrong") {
  if (!error?.response) {
    const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001";
    return `Cannot reach the API at ${baseURL}. Is the backend running? (Use backend .venv: .\\.venv\\Scripts\\Activate.ps1 then uvicorn app.main:app --reload --port 8001)`;
  }
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg ?? JSON.stringify(item)).join("; ");
  }
  return fallback;
}
