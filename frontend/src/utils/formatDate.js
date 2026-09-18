export function formatDate(value) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function formatRelativeDate(value, now = Date.now()) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = date.getTime() - now;
  const diffDays = Math.round(diffMs / MS_PER_DAY);
  const absDays = Math.abs(diffDays);

  if (absDays === 0) {
    return "Today";
  }

  const unit = absDays === 1 ? "day" : "days";
  if (diffDays < 0) {
    return absDays === 1 ? "1 day ago" : `${absDays} ${unit} ago`;
  }
  return absDays === 1 ? "in 1 day" : `in ${absDays} ${unit}`;
}
