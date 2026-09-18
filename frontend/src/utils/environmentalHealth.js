/**
 * Environmental health score (0–100) for the Site Overview KPI.
 *
 * Replace the body of `computeEnvironmentalHealthScore` when the scoring
 * model is ready. Callers should keep passing the same context object.
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function computeEnvironmentalHealthScore({
  carbonLatest = null,
  biodiversityLatest = null,
} = {}) {
  const parts = [];

  if (Number.isFinite(biodiversityLatest)) {
    parts.push(clamp(biodiversityLatest * 100, 0, 100));
  }

  if (Number.isFinite(carbonLatest) && carbonLatest > 0) {
    // Interim stand-in only: maps unbounded tCO₂e onto a 0–100 range until
    // the real health model is implemented. Do not treat this as a certified score.
    parts.push(clamp((carbonLatest / (carbonLatest + 20)) * 100, 0, 100));
  }

  if (parts.length === 0) {
    return null;
  }

  return Math.round(parts.reduce((sum, part) => sum + part, 0) / parts.length);
}
