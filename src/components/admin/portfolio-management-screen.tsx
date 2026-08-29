import {
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  Globe2,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/admin-shell";
import {
  EmptyState,
  formatDate,
  formatNumber,
  PageHeading,
  Pagination,
  StatCard,
  StatusBadge,
} from "@/components/admin/admin-primitives";
import type { AdminPortfolio, PageResult } from "@/types/admin";

type PortfolioQuery = {
  search: string;
  status: "all" | "published" | "draft" | "private";
  themeId: string;
  ownerId: string;
  order: "updated" | "newest" | "oldest" | "title";
};

function listHref(query: PortfolioQuery, page: number): string {
  const params = new URLSearchParams({ status: query.status, order: query.order });
  if (page > 1) params.set("page", String(page));
  if (query.search) params.set("search", query.search);
  if (query.themeId) params.set("themeId", query.themeId);
  if (query.ownerId) params.set("ownerId", query.ownerId);
  return `/admin/portfolios?${params}`;
}

export function PortfolioManagementScreen({
  portfolios,
  stats,
  filters,
  query,
}: {
  portfolios: PageResult<AdminPortfolio>;
  stats: {
    totalPortfolios: number;
    publishedPortfolios: number;
    draftPortfolios: number;
    privatePortfolios: number;
  };
  filters: {
    themes: { id: string; name: string }[];
    owners: { id: string; full_name: string | null; username: string | null }[];
  };
  query: PortfolioQuery;
}) {
  return (
    <div className="admin-page">
      <PageHeading
        title="Portfolio management"
        description="Review portfolio ownership, publishing state, theme metadata, and views."
      />
      <div className="admin-stats admin-stats--four">
        <StatCard icon={BriefcaseBusiness} label="Total" value={stats.totalPortfolios} tone="purple" />
        <StatCard icon={Globe2} label="Published" value={stats.publishedPortfolios} tone="green" />
        <StatCard icon={FileText} label="Drafts" value={stats.draftPortfolios} />
        <StatCard icon={LockKeyhole} label="Private" value={stats.privatePortfolios} tone="orange" />
      </div>
      <section className="admin-card admin-manager">
        <div className="admin-manager__heading"><h2>All portfolios</h2></div>
        <div className="admin-manager__filters">
          <form action="/admin/portfolios" className="admin-filter-form">
            <input name="search" type="search" defaultValue={query.search} placeholder="Search title or slug" aria-label="Search portfolios" />
            <select name="status" defaultValue={query.status} aria-label="Filter portfolio status">
              <option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="private">Private</option>
            </select>
            <select name="themeId" defaultValue={query.themeId} aria-label="Filter theme">
              <option value="">All themes</option>{filters.themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
            </select>
            <select name="ownerId" defaultValue={query.ownerId} aria-label="Filter owner">
              <option value="">All owners</option>{filters.owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name || owner.username || "Unnamed user"}</option>)}
            </select>
            <select name="order" defaultValue={query.order} aria-label="Sort portfolios">
              <option value="updated">Recently updated</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="title">Title</option>
            </select>
            <button className="admin-button admin-button--primary" type="submit">Apply</button>
          </form>
          <Link href="/admin/portfolios">Clear filters</Link>
        </div>
        {portfolios.items.length ? (
          <div className="admin-table-scroll">
            <table>
              <thead><tr><th>Portfolio</th><th>Owner</th><th>Theme</th><th>Status</th><th>Updated</th><th>Views</th><th>Public view</th></tr></thead>
              <tbody>{portfolios.items.map((portfolio) => {
                const owner = portfolio.owner?.full_name || portfolio.owner?.username || "Unassigned";
                return <tr key={portfolio.id}>
                  <td><strong>{portfolio.title}</strong><small>/{portfolio.slug}</small></td>
                  <td><span className="admin-person">{portfolio.owner ? <Avatar profile={portfolio.owner} small /> : null}{owner}</span></td>
                  <td>{portfolio.theme ? <Link href={`/admin/themes?search=${encodeURIComponent(portfolio.theme.slug)}`}>{portfolio.theme.name}<small>{portfolio.theme.layout_key}</small></Link> : "No theme"}</td>
                  <td><StatusBadge value={portfolio.status} /></td>
                  <td>{formatDate(portfolio.updated_at)}</td>
                  <td>{formatNumber(portfolio.views)}</td>
                  <td>{portfolio.status === "published" ? <Link className="admin-icon-link" href={`/p/${portfolio.slug}`} target="_blank" aria-label={`Open ${portfolio.title}`}><ExternalLink aria-hidden="true" /></Link> : "—"}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        ) : <EmptyState icon={BriefcaseBusiness} title="No portfolios found" description="Portfolio metadata will appear here when users create portfolios." />}
        <Pagination result={portfolios} hrefForPage={(page) => listHref(query, page)} label="portfolios" />
      </section>
    </div>
  );
}
