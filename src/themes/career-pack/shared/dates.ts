const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;

export function formatThemeDate(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  const match = YEAR_MONTH_PATTERN.exec(normalized);
  if (!match) {
    return normalized;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return normalized;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatThemeDateRange(
  startDate: string,
  endDate: string,
  isCurrent = false,
): string {
  const start = formatThemeDate(startDate);
  const end = isCurrent ? "Present" : formatThemeDate(endDate);

  return [start, end].filter(Boolean).join(" – ");
}
