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
    <Card>
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
    <main className="flex flex-1 bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 aria-hidden="true" className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Portfolio insights</h1>
            <p className="text-sm text-muted-foreground">
              Privacy-friendly public portfolio views, grouped in UTC.
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/dashboard">
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
            <Card>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <form className="flex flex-1 flex-col gap-2 sm:max-w-md" method="get">
                  <label className="text-sm font-medium" htmlFor="portfolio">Portfolio</label>
                  <div className="flex gap-2">
                    <select
                      className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
                    <button className={buttonVariants()} type="submit">View</button>
                  </div>
                </form>
                <div>
                  <p className="font-medium">{result.portfolio.title}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {result.portfolio.status} · /p/{result.portfolio.slug}
                  </p>
                </div>
              </CardContent>
            </Card>

            <section aria-label="View totals" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total views", result.metrics.total],
                ["Today (UTC)", result.metrics.today],
                ["Last 7 days", result.metrics.last7Days],
                ["Last 30 days", result.metrics.last30Days],
              ].map(([label, value]) => (
                <Card key={label}>
                  <CardHeader>
                    <CardDescription>{label}</CardDescription>
                    <CardTitle>
                      <p className="text-3xl font-semibold tabular-nums">
                        {value.toLocaleString("en-IN")}
                      </p>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
              <Card>
                <CardHeader className="sm:flex sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle><h2>Daily views</h2></CardTitle>
                    <CardDescription>Actual public visits over the last {range} days.</CardDescription>
                  </div>
                  <div aria-label="Chart range" className="mt-3 flex gap-1 sm:mt-0">
                    {[7, 30].map((days) => (
                      <Link
                        aria-current={range === days ? "page" : undefined}
                        className={cn(buttonVariants({
                          size: "sm",
                          variant: range === days ? "default" : "outline",
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
                    <div className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
                      <Eye aria-hidden="true" className="size-6 text-muted-foreground" />
                      <p className="font-medium">No views yet</p>
                      <p className="max-w-sm text-sm text-muted-foreground">
                        Visits appear here after someone opens the published portfolio.
                      </p>
                    </div>
                  ) : (
                    <DailyChart daily={result.daily} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle><h2>Recent activity</h2></CardTitle>
                  <CardDescription>No visitor identity is collected.</CardDescription>
                </CardHeader>
                <CardContent>
                  {result.recent.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No visits yet.</p>
                  ) : (
                    <ol className="space-y-4">
                      {result.recent.map((visit, index) => (
                        <li className="flex gap-3" key={`${visit.createdAt}-${index}`}>
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                          <div>
                            <p className="font-medium">Portfolio viewed</p>
                            <p className="text-xs text-muted-foreground">
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

            <p className="text-xs text-muted-foreground">
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
      <div className="flex h-56 items-end gap-1" role="img">
        {daily.map(({ date, views }) => (
          <div
            aria-label={`${date}: ${views} ${views === 1 ? "view" : "views"}`}
            className="group relative flex h-full min-w-0 flex-1 items-end"
            key={date}
          >
            <div
              className="w-full min-w-1 rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
              style={{ height: `${views === 0 ? 2 : Math.max(8, (views / maximum) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
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
