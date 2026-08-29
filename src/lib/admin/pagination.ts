export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function pagination(pageValue?: string, pageSizeValue?: string) {
  const page = positiveInteger(pageValue, 1);
  const pageSize = Math.min(
    positiveInteger(pageSizeValue, DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );
  const from = (page - 1) * pageSize;

  return { page, pageSize, from, to: from + pageSize - 1 };
}

export function safeSearch(value?: string): string {
  return (value ?? "")
    .trim()
    .slice(0, 100)
    .replace(/[%,()_]/g, "");
}
