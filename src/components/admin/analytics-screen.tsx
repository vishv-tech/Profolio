import { BriefcaseBusiness, Download, Eye, PieChart, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/admin-shell";
import { formatNumber, PageHeading, StatCard, StatusBadge } from "@/components/admin/admin-primitives";
import type { AdminPortfolio, AnalyticsData, DashboardMetrics, TimeSeriesPoint } from "@/types/admin";

function points(series: TimeSeriesPoint[], width: number, height: number): string {
  if (series.length < 2) return "";
  const maximum = Math.max(...series.map((point) => point.value), 1);
  return series.map((point, index) => `${((index / (series.length - 1)) * width).toFixed(1)},${(height - (point.value / maximum) * (height - 8) - 4).toFixed(1)}`).join(" ");
}

function LineChart({ series, label }: { series: TimeSeriesPoint[]; label: string }) {
  const path = points(series, 700, 230);
  const hasValues = series.some((point) => point.value > 0);
  return <section className="admin-card admin-analytics-chart"><header><h2>{label}</h2></header>{path && hasValues ? <svg viewBox="0 0 700 230" role="img" aria-label={label}>{[0, 57.5, 115, 172.5, 230].map((y) => <line key={y} x1="0" x2="700" y1={y} y2={y} stroke="#dce3db" />)}<polyline points={path} fill="none" stroke="#567565" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg> : <p>No events recorded in this period.</p>}</section>;
}

function ThemeBars({ data }: { data: AnalyticsData["themeUsage"] }) {
  const maximum = Math.max(...data.map((item) => item.value), 1);
  return <section className="admin-card admin-list-card"><header><h2>Theme usage</h2><Link href="/admin/themes">Manage themes</Link></header>{data.length ? <ol className="admin-bars">{data.slice(0, 10).map((item) => <li key={item.id}><span>{item.name}</span><i><b style={{ width: `${(item.value / maximum) * 100}%` }} /></i><strong>{formatNumber(item.value)}</strong></li>)}</ol> : <p className="admin-list-card__empty">No theme usage recorded.</p>}</section>;
}

export function AnalyticsScreen({ analytics, metrics, portfolios, days }: { analytics: AnalyticsData; metrics: DashboardMetrics; portfolios: AdminPortfolio[]; days: 7 | 30 | 90 | 365 }) {
  const newUsers = analytics.userGrowth.reduce((sum, point) => sum + point.value, 0);
  const publishingRate = metrics.totalPortfolios ? (metrics.publishedPortfolios / metrics.totalPortfolios) * 100 : 0;
  return <div className="admin-page">
    <PageHeading title="Platform analytics" description="Analyze recorded portfolio view events, user growth, and theme adoption." actions={<><form action="/admin/analytics" className="admin-period-form"><select name="days" defaultValue={days} aria-label="Analytics period"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></select><button className="admin-button admin-button--primary" type="submit">Update</button></form><a className="admin-button admin-button--secondary" href={`/admin/export?scope=analytics&days=${days}`}><Download aria-hidden="true" /> Export</a></>} />
    <div className="admin-stats admin-stats--four"><StatCard icon={Eye} label="Total views" value={analytics.totalViews} /><StatCard icon={TrendingUp} label="Views today" value={analytics.viewsToday} tone="cyan" /><StatCard icon={Users} label="New users" value={newUsers} tone="purple" detail={`Last ${days} days`} /><StatCard icon={PieChart} label="Publishing rate" value={Math.round(publishingRate)} tone="green" detail="Published share (%)" /></div>
    <div className="admin-analytics-grid"><LineChart series={analytics.viewsOverTime} label="Portfolio views over time" /><ThemeBars data={analytics.themeUsage} /><LineChart series={analytics.userGrowth} label="New users over time" /><LineChart series={analytics.portfolioGrowth} label="New portfolios over time" /></div>
    <section className="admin-card admin-table-card"><header><h2>Most viewed portfolios in this period</h2></header>{portfolios.length ? <div className="admin-table-scroll"><table><thead><tr><th>Portfolio</th><th>Owner</th><th>Theme</th><th>Views</th><th>Status</th></tr></thead><tbody>{portfolios.map((portfolio) => { const owner = portfolio.owner?.full_name || portfolio.owner?.username || "Unassigned"; return <tr key={portfolio.id}><td><Link href={`/admin/portfolios?search=${encodeURIComponent(portfolio.slug)}`}><strong>{portfolio.title}</strong><small>/{portfolio.slug}</small></Link></td><td><span className="admin-person">{portfolio.owner ? <Avatar profile={portfolio.owner} small /> : null}{owner}</span></td><td>{portfolio.theme?.name || "No theme"}</td><td>{formatNumber(portfolio.views)}</td><td><StatusBadge value={portfolio.status} /></td></tr>; })}</tbody></table></div> : <p className="admin-list-card__empty">No portfolio views recorded in this period.</p>}</section>
    <section className="admin-card admin-analytics-note"><BriefcaseBusiness aria-hidden="true" /><p>Analytics use recorded portfolio views only. No sample or inferred engagement data is shown.</p></section>
  </div>;
}
