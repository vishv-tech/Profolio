import { CloudUpload, History, Layers, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/admin-shell";
import { EmptyState, formatDate, PageHeading, Pagination, StatCard, StatusBadge } from "@/components/admin/admin-primitives";
import type { AdminDeployment, PageResult } from "@/types/admin";

type DeploymentQuery = { search: string; status: "all" | "current" | "historical" | "rolled_back"; portfolioId: string; dateRange: "7" | "30" | "all"; order: "newest" | "oldest" };

function listHref(query: DeploymentQuery, page: number, deployment?: string): string {
  const params = new URLSearchParams({ status: query.status, date: query.dateRange, order: query.order });
  if (page > 1) params.set("page", String(page)); if (query.search) params.set("search", query.search); if (query.portfolioId) params.set("portfolioId", query.portfolioId); if (deployment) params.set("deployment", deployment);
  return `/admin/deployments?${params}`;
}

function displayId(value: string): string { return `dep_${value.replaceAll("-", "").slice(0, 8).toUpperCase()}`; }

export function DeploymentManagementScreen({ deployments, stats, filters, query, selectedDeploymentId }: { deployments: PageResult<AdminDeployment>; stats: { totalDeployments: number; currentVersions: number; historicalVersions: number; rolledBack: number }; filters: { portfolios: { id: string; title: string; slug: string }[] }; query: DeploymentQuery; selectedDeploymentId: string }) {
  const selected = deployments.items.find((deployment) => deployment.id === selectedDeploymentId);
  return <div className="admin-page">
    <PageHeading title="Deployment history" description="Inspect immutable publication records created by the existing portfolio publishing workflow." />
    <div className="admin-stats admin-stats--four"><StatCard icon={CloudUpload} label="Total deployments" value={stats.totalDeployments} tone="purple" /><StatCard icon={Layers} label="Current versions" value={stats.currentVersions} tone="green" /><StatCard icon={History} label="Historical versions" value={stats.historicalVersions} /><StatCard icon={RotateCcw} label="Rolled back" value={stats.rolledBack} tone="orange" /></div>
    <section className="admin-card admin-manager">
      <div className="admin-manager__filters"><form action="/admin/deployments" className="admin-filter-form"><input name="search" type="search" defaultValue={query.search} placeholder="Search portfolio or deployment UUID" aria-label="Search deployments" /><select name="status" defaultValue={query.status}><option value="all">All statuses</option><option value="current">Current</option><option value="historical">Historical</option><option value="rolled_back">Rolled back</option></select><select name="portfolioId" defaultValue={query.portfolioId}><option value="">All portfolios</option>{filters.portfolios.map((portfolio) => <option key={portfolio.id} value={portfolio.id}>{portfolio.title || portfolio.slug}</option>)}</select><select name="date" defaultValue={query.dateRange}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select><select name="order" defaultValue={query.order}><option value="newest">Newest</option><option value="oldest">Oldest</option></select><button className="admin-button admin-button--primary" type="submit">Apply</button></form><Link href="/admin/deployments">Clear filters</Link></div>
      {deployments.items.length ? <div className="admin-table-scroll"><table><thead><tr><th>Deployment</th><th>Portfolio</th><th>Owner</th><th>Version</th><th>Theme</th><th>Status</th><th>Published</th><th>Details</th></tr></thead><tbody>{deployments.items.map((deployment) => { const owner = deployment.owner?.full_name || deployment.owner?.username || "Unassigned"; return <tr key={deployment.id}><td><strong>{displayId(deployment.id)}</strong><small>{deployment.id}</small></td><td>{deployment.portfolio ? <Link href={`/admin/portfolios?search=${encodeURIComponent(deployment.portfolio.slug)}`}>{deployment.portfolio.title || deployment.portfolio.slug}</Link> : "Unknown"}</td><td><span className="admin-person">{deployment.owner ? <Avatar profile={deployment.owner} small /> : null}{owner}</span></td><td>v{deployment.version}</td><td>{deployment.theme?.name || "No theme"}</td><td><StatusBadge value={deployment.status} /></td><td>{formatDate(deployment.created_at, true)}</td><td><Link href={listHref(query, deployments.page, deployment.id)}>View</Link></td></tr>; })}</tbody></table></div> : <EmptyState icon={CloudUpload} title="No deployments found" description="Deployment history appears here when portfolios are published." />}
      {selected ? <aside className="admin-detail"><header><div><h3>{displayId(selected.id)}</h3><p>Publication metadata only; content snapshots remain inside the publishing boundary.</p></div><Link href={listHref(query, deployments.page)}>Close</Link></header><dl><div><dt>Portfolio</dt><dd>{selected.portfolio?.title || selected.portfolio?.slug || "Unknown"}</dd></div><div><dt>Version</dt><dd>v{selected.version}</dd></div><div><dt>Theme</dt><dd>{selected.theme?.name || "No theme"}</dd></div><div><dt>Layout</dt><dd>{selected.theme?.layout_key || "—"}</dd></div><div><dt>Publisher</dt><dd>{selected.publisher?.full_name || selected.publisher?.username || "Unknown"}</dd></div><div><dt>Status</dt><dd>{selected.status.replaceAll("_", " ")}</dd></div></dl><p>Rollback is not exposed because the existing publishing workflow does not provide a rollback mutation.</p></aside> : null}
      <Pagination result={deployments} hrefForPage={(page) => listHref(query, page)} label="deployments" />
    </section>
  </div>;
}
