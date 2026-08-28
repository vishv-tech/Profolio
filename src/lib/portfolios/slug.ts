const MAX_SLUG_LENGTH = 100;
const MAX_SLUG_BASE_LENGTH = 90;

function normalizeSlugSource(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_BASE_LENGTH)
    .replace(/-+$/g, "");
}

export function createPortfolioSlugBase(
  preferredSource: string | null | undefined,
  fallbackSource?: string | null,
) {
  return (
    normalizeSlugSource(preferredSource) ||
    normalizeSlugSource(fallbackSource) ||
    "portfolio"
  );
}

export function createPortfolioSlugCandidate(
  slugBase: string,
  collisionNumber = 1,
) {
  if (collisionNumber <= 1) {
    return slugBase;
  }

  const suffix = `-${collisionNumber}`;
  const truncatedBase = slugBase
    .slice(0, MAX_SLUG_LENGTH - suffix.length)
    .replace(/-+$/g, "");

  return `${truncatedBase || "portfolio"}${suffix}`;
}
