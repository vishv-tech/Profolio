import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { PageResult } from "@/types/admin";

const number = new Intl.NumberFormat("en-US");
const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatNumber(value: number): string {
  return number.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string, includeTime = false): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "—";
  return includeTime ? dateTime.format(parsed) : date.format(parsed);
}

export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="admin-page__heading">
      <div>
        <span className="admin-page__eyebrow">Admin console</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="admin-page__actions">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "blue",
  detail = "Current total",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: "blue" | "green" | "purple" | "orange" | "red" | "cyan";
  detail?: string;
}) {
  return (
    <section className="admin-card admin-stat">
      <span className={`admin-stat__icon admin-stat__icon--${tone}`}>
        <Icon aria-hidden="true" />
      </span>
      <span className="admin-stat__copy">
        <small>{label}</small>
        <strong>{formatNumber(value)}</strong>
        <em>{detail}</em>
      </span>
    </section>
  );
}

export function Notice({
  message,
}: {
  message?: { kind: "success" | "error"; text: string };
}) {
  return message ? (
    <p className={`admin-notice admin-notice--${message.kind}`} role="status">
      {message.text}
    </p>
  ) : null;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="admin-empty">
      <span>
        <Icon aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function pageValues(total: number, current: number): Array<number | null> {
  const values = [
    ...new Set([1, 2, current - 1, current, current + 1, total - 1, total]),
  ]
    .filter((value) => value >= 1 && value <= total)
    .sort((left, right) => left - right);

  return values.flatMap((value, index) =>
    index && value > values[index - 1] + 1 ? [null, value] : [value],
  );
}

export function Pagination<T>({
  result,
  hrefForPage,
  label,
}: {
  result: PageResult<T>;
  hrefForPage: (page: number) => string;
  label: string;
}) {
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const start = result.total ? (result.page - 1) * result.pageSize + 1 : 0;
  const end = Math.min(result.page * result.pageSize, result.total);

  return (
    <footer className="admin-pagination">
      <span>
        Showing {start}–{end} of {formatNumber(result.total)} {label}
      </span>
      {totalPages > 1 ? (
        <nav aria-label={`${label} pagination`}>
          {result.page > 1 ? (
            <Link href={hrefForPage(result.page - 1)}>Previous</Link>
          ) : (
            <span aria-disabled="true">Previous</span>
          )}
          {pageValues(totalPages, result.page).map((value, index) =>
            value === null ? (
              <i key={`gap-${index}`}>…</i>
            ) : (
              <Link
                key={value}
                href={hrefForPage(value)}
                className={value === result.page ? "is-current" : ""}
                aria-current={value === result.page ? "page" : undefined}
              >
                {value}
              </Link>
            ),
          )}
          {result.page < totalPages ? (
            <Link href={hrefForPage(result.page + 1)}>Next</Link>
          ) : (
            <span aria-disabled="true">Next</span>
          )}
        </nav>
      ) : null}
    </footer>
  );
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`admin-status admin-status--${value.replaceAll("_", "-")}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
