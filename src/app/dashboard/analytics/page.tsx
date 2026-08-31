import { ArrowLeft, BarChart3, Eye, FileUp } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveAnalyticsRange } from "@/lib/analytics/core";
import { getOwnedPortfolioAnalytics } from "@/lib/analytics/queries";
import { requireActiveUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

import workspaceStyles from "@/components/workspace/workspace.module.css";
import utilityStyles from "../dashboard-utilities.module.css";
import styles from "./analytics.module.css";

type AnalyticsPageProps = {
  searchParams: Promise<{
    portfolio?: string | string[];
    range?: string | string[];
  }>;
};

function Message({
  description,
  showUpload = false,
  title,
}: {
  description: string;
  showUpload?: boolean;
  title: string;
}) {
  return (
    <Card className={utilityStyles.messageCard}>
      <CardHeader>
        <CardTitle><h2>{title}</h2></CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {showUpload ? (
          <Link className={buttonVariants()} href="/upload">
            <FileUp aria-hidden="true" /> Create portfolio
          </Link>
        ) : null}
        <Link className={buttonVariants({ variant: "outline" })} href="/dashboard">
          <ArrowLeft aria-hidden="true" /> Dashboard
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const user = await requireActiveUser();
  const params = await searchParams;
  const portfolioId = typeof params.portfolio === "string" ? params.portfolio : null;
  const range = resolveAnalyticsRange(typeof params.range === "string" ? params.range : null);
  const result = await getOwnedPortfolioAnalytics(user.userId, portfolioId, range);

  return (
    <main className={`${workspaceStyles.page} ${workspaceStyles.applicationSurface}`}>
      <div className={`${workspaceStyles.container} space-y-6`}>
        <header className={utilityStyles.pageHeader}>
          <div>
            <div className={utilityStyles.headerIcon}>
              <BarChart3 aria-hidden="true" className="size-5" />
            </div>
            <p className={`${workspaceStyles.eyebrow} mt-4`}>Portfolio insights</p>
            <h1 className={utilityStyles.title}>See how your portfolio is performing.</h1>
            <p className={utilityStyles.description}>
              Understand real public portfolio views while keeping visitor data private.
            </p>
          </div>
          <Link className={`${buttonVariants({ variant: "outline" })} ${utilityStyles.backButton}`} href="/dashboard">
            <ArrowLeft aria-hidden="true" /> Dashboard
          </Link>
        </header>

        {result.status === "empty" ? (
          <Message
            description="Create and publish a portfolio to start collecting real visit data."
            showUpload
            title="No portfolios yet"
          />
        ) : result.status === "unavailable" ? (
          <Message
            description="The requested portfolio is unavailable to this account."
            title="Portfolio unavailable"
          />
        ) : result.status === "error" ? (
          <Message
            description="Visit insights could not be loaded. Please try again shortly."
            title="Analytics unavailable"
          />
        ) : (
          <>
            <Card className={utilityStyles.selectorCard}>
              <CardContent className={utilityStyles.selectorContent}>
                <form className={utilityStyles.selectorForm} method="get">
                  <label htmlFor="portfolio">Portfolio</label>
                  <div className={utilityStyles.selectorRow}>
                    <select
                      defaultValue={result.portfolio.id}
                      id="portfolio"
                      name="portfolio"
                    >
                      {result.portfolios.map((portfolio) => (
                        <option key={portfolio.id} value={portfolio.id}>
                          {portfolio.title} ({portfolio.status})
                        </option>
                      ))}
                    </select>
                    <input name="range" type="hidden" value={range} />
                    <button className={`${buttonVariants()} ${utilityStyles.selectorButton}`} type="submit">View</button>
                  </div>
                </form>
                <div>
                  <p className={utilityStyles.selectionTitle}>{result.portfolio.title}</p>
                  <p className={utilityStyles.selectionMeta}>
                    {result.portfolio.status} · /p/{result.portfolio.slug}
                  </p>
                </div>
              </CardContent>
            </Card>

            <section aria-label="View totals" className={styles.stats}>
              {[
                ["Total views", result.metrics.total],
                ["Today (UTC)", result.metrics.today],
                ["Last 7 days", result.metrics.last7Days],
                ["Last 30 days", result.metrics.last30Days],
              ].map(([label, value]) => (
                <Card className={styles.statCard} key={label}>
                  <CardHeader>
                    <CardDescription className={styles.statLabel}>{label}</CardDescription>
                    <CardTitle>
                      <p className={`${styles.statValue} tabular-nums`}>
                        {value.toLocaleString("en-IN")}
                      </p>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </section>

            <div className={styles.insightsGrid}>
              <Card className={styles.chartCard}>
                <CardHeader className={styles.chartHeader}>
                  <div>
                    <CardTitle><h2>Daily views</h2></CardTitle>
                    <CardDescription>Actual public visits over the last {range} days.</CardDescription>
                  </div>
                  <div aria-label="Chart range" className={styles.rangeControl}>
                    {[7, 30].map((days) => (
                      <Link
                        aria-current={range === days ? "page" : undefined}
                        className={cn(styles.rangeLink, range === days && styles.rangeLinkActive, buttonVariants({
                          size: "sm",
                          variant: "ghost",
                        }))}
                        href={`/dashboard/analytics?portfolio=${result.portfolio.id}&range=${days}`}
                        key={days}
                      >
                        {days} days
                      </Link>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {result.daily.every(({ views }) => views === 0) ? (
                    <div className={styles.emptyChart}>
                      <span className={styles.emptyIcon}><Eye aria-hidden="true" className="size-5" /></span>
                      <strong>No views yet.</strong>
                      <p>
                        Your portfolio activity will appear here after visitors start viewing it.
                      </p>
                    </div>
                  ) : (
                    <DailyChart daily={result.daily} />
                  )}
                </CardContent>
              </Card>

              <Card className={styles.activityCard}>
                <CardHeader>
                  <CardTitle><h2>Recent activity</h2></CardTitle>
                  <CardDescription>No visitor identity is collected.</CardDescription>
                </CardHeader>
                <CardContent>
                  {result.recent.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    <ol className={styles.activityList}>
                      {result.recent.map((visit, index) => (
                        <li className={styles.activityItem} key={`${visit.createdAt}-${index}`}>
                          <span className={styles.activityDot} />
                          <div>
                            <p className={styles.activityTitle}>Portfolio viewed</p>
                            <p className={styles.activityMeta}>
                              {visit.referrer} · {formatUtc(visit.createdAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </div>

            <p className={styles.privacyNote}>
              Views are approximate: each browser tab session counts at most once per portfolio.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function DailyChart({ daily }: { daily: Array<{ date: string; views: number }> }) {
  const maximum = Math.max(...daily.map(({ views }) => views), 1);

  return (
    <figure aria-label="Daily portfolio views">
      <div className={styles.chart} role="img">
        {daily.map(({ date, views }) => (
          <div
            aria-label={`${date}: ${views} ${views === 1 ? "view" : "views"}`}
            className={styles.chartColumn}
            key={date}
          >
            <div
              className={styles.chartBar}
              style={{ height: `${views === 0 ? 2 : Math.max(8, (views / maximum) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className={styles.chartLabels}>
        <span>{daily[0]?.date}</span>
        <span>{daily.at(-1)?.date}</span>
      </div>
      <ol className="sr-only">
        {daily.map(({ date, views }) => (
          <li key={date}>{`${date}: ${views} ${views === 1 ? "view" : "views"}`}</li>
        ))}
      </ol>
    </figure>
  );
}

function formatUtc(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown time";

  return `${new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`;
}
