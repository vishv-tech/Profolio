import {
  BriefcaseBusiness,
  CloudUpload,
  Eye,
  FileCheck2,
  Palette,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/admin-shell";
import {
  formatDate,
  formatNumber,
  PageHeading,
  StatCard,
  StatusBadge,
} from "@/components/admin/admin-primitives";
import type { DashboardData, TimeSeriesPoint } from "@/types/admin";

function chartPoints(
  series: TimeSeriesPoint[],
  width = 640,
  height = 220,
): string {
  if (series.length < 2) return "";
  const values = series.map((point) => point.value);
  const maximum = Math.max(...values, 1);

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / maximum) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function ViewsChart({ series }: { series: TimeSeriesPoint[] }) {
  const points = chartPoints(series);
  const total = series.reduce((sum, point) => sum + point.value, 0);

  return (
    <section className="admin-card admin-chart-card">
      <header>
        <div>
          <h2>Portfolio views</h2>
          <p>Daily view events over the last 30 days</p>
        </div>
        <strong>{formatNumber(total)}</strong>
      </header>
      {points ? (
        <svg viewBox="0 0 640 220" role="img" aria-label="Portfolio views chart">
          <defs>
            <linearGradient id="admin-chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1769f5" stopOpacity=".25" />
              <stop offset="100%" stopColor="#1769f5" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 55, 110, 165, 220].map((y) => (
            <line key={y} x1="0" x2="640" y1={y} y2={y} stroke="#e7edf5" />
          ))}
          <polygon points={`0,220 ${points} 640,220`} fill="url(#admin-chart-fill)" />
          <polyline
            points={points}
            fill="none"
            stroke="#1267f8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <p className="admin-chart-card__empty">No view history recorded yet.</p>
      )}
    </section>
  );
}

function ThemeUsage({ data }: { data: DashboardData["analytics"]["themeUsage"] }) {
  const maximum = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="admin-card admin-list-card">
      <header>
        <h2>Theme distribution</h2>
        <Link href="/admin/themes">Manage themes</Link>
      </header>
      {data.length ? (
        <ol className="admin-bars">
          {data.slice(0, 6).map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <i>
                <b style={{ width: `${(item.value / maximum) * 100}%` }} />
              </i>
              <strong>{formatNumber(item.value)}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="admin-list-card__empty">No portfolios use a theme yet.</p>
      )}
    </section>
  );
}

export function DashboardScreen({
  data,
  adminName,
}: {
  data: DashboardData;
  adminName: string;
}) {
  return (
    <div className="admin-page">
      <PageHeading
        title={`Welcome back, ${adminName}`}
        description="A live operational view of Profolio records and publishing activity."
        actions={
          <Link className="admin-button admin-button--secondary" href="/admin/export">
            Export report
          </Link>
        }
      />

      <div className="admin-stats admin-stats--three">
        <StatCard icon={Users} label="Total users" value={data.metrics.totalUsers} />
        <StatCard
          icon={BriefcaseBusiness}
          label="Total portfolios"
          value={data.metrics.totalPortfolios}
          tone="purple"
        />
        <StatCard
          icon={FileCheck2}
          label="Completed resumes"
          value={data.metrics.completedResumes}
          tone="green"
        />
        <StatCard
          icon={CloudUpload}
          label="Deployments"
          value={data.metrics.totalDeployments}
          tone="orange"
        />
        <StatCard
          icon={Eye}
          label="Portfolio views"
          value={data.metrics.totalViews}
          tone="cyan"
        />
        <StatCard
          icon={Palette}
          label="Active themes"
          value={data.metrics.activeThemes}
          tone="red"
        />
      </div>

      <div className="admin-dashboard-grid">
        <ViewsChart series={data.analytics.viewsOverTime} />
        <ThemeUsage data={data.analytics.themeUsage} />
        <section className="admin-card admin-list-card">
          <header>
            <h2>Recent activity</h2>
            <Link href="/admin/analytics">View analytics</Link>
          </header>
          {data.recentActivity.length ? (
            <ol className="admin-activity">
              {data.recentActivity.map((item) => (
                <li key={item.id}>
                  <span className={`admin-activity__dot admin-activity__dot--${item.kind}`} />
                  <span>
                    <strong>{item.title}</strong>
                    {item.detail ? <small>{item.detail}</small> : null}
                  </span>
                  <time dateTime={item.occurredAt}>{formatDate(item.occurredAt)}</time>
                </li>
              ))}
            </ol>
          ) : (
            <p className="admin-list-card__empty">No activity recorded yet.</p>
          )}
        </section>
      </div>

      <section className="admin-card admin-table-card">
        <header>
          <h2>Top performing portfolios</h2>
          <Link href="/admin/portfolios">View all portfolios</Link>
        </header>
        {data.topPortfolios.length ? (
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Portfolio</th>
                  <th>Owner</th>
                  <th>Theme</th>
                  <th>Views</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.topPortfolios.map((portfolio) => (
                  <tr key={portfolio.id}>
                    <td>
                      <Link href={`/p/${portfolio.slug}`}>{portfolio.title}</Link>
                      <small>/{portfolio.slug}</small>
                    </td>
                    <td>
                      <span className="admin-person">
                        {portfolio.owner ? <Avatar profile={portfolio.owner} small /> : null}
                        {portfolio.owner?.full_name || portfolio.owner?.username || "Unassigned"}
                      </span>
                    </td>
                    <td>{portfolio.theme?.name || "No theme"}</td>
                    <td>{formatNumber(portfolio.views)}</td>
                    <td><StatusBadge value={portfolio.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-list-card__empty">No portfolio view events yet.</p>
        )}
      </section>
    </div>
  );
}
