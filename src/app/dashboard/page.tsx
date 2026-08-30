import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Download,
  FileUp,
  History,
  Palette,
  Pencil,
  Rocket,
} from "lucide-react";
import Link from "next/link";

import { DeploymentActions } from "@/components/portfolio/deployment-actions";
import { ManualPortfolioButton } from "@/components/portfolio/manual-portfolio-button";
import { PortfolioScoreCard } from "@/components/portfolio/portfolio-score-card";
import { UpgradePlanCard } from "@/components/portfolio-intelligence/upgrade-plan-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PublishedSuccessBanner } from "@/components/workspace/published-success-banner";
import { requireActiveUser } from "@/lib/auth/guards";
import { scorePortfolio } from "@/lib/portfolio-score/score";
import { getPortfolioWorkspace } from "@/lib/portfolios/workspace";
import type { WorkspacePortfolioChoice } from "@/lib/portfolios/workspace-model";

type DashboardPageProps = {
  searchParams: Promise<{
    portfolio?: string | string[];
    published?: string | string[];
  }>;
};

function searchValue(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function PortfolioChooser({
  portfolios,
  selectedId,
}: {
  portfolios: WorkspacePortfolioChoice[];
  selectedId?: string;
}) {
  if (portfolios.length < 2) return null;

  return (
    <form className="flex flex-col gap-2 sm:max-w-md" method="get">
      <label className="text-sm font-medium" htmlFor="portfolio">
        Portfolio
      </label>
      <div className="flex gap-2">
        <select
          className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue={selectedId}
          id="portfolio"
          name="portfolio"
        >
          {portfolios.map((portfolio) => (
            <option key={portfolio.id} value={portfolio.id}>
              {portfolio.title} ({portfolio.status})
            </option>
          ))}
        </select>
        <button className={buttonVariants()} type="submit">
          View
        </button>
      </div>
    </form>
  );
}

function WorkspaceMessage({
  description,
  portfolios = [],
  title,
}: {
  description: string;
  portfolios?: WorkspacePortfolioChoice[];
  title: string;
}) {
  return (
    <main className="flex flex-1 bg-muted/30 px-4 py-10 sm:px-6">
      <Card className="mx-auto h-fit w-full max-w-2xl">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Rocket aria-hidden="true" className="size-5" />
          </div>
          <CardTitle><h1>{title}</h1></CardTitle>
          <CardDescription className="leading-6">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PortfolioChooser portfolios={portfolios} />
          <div className="flex flex-wrap gap-2">
            <Link className={buttonVariants()} href="/upload">
              <FileUp aria-hidden="true" />
              Upload Resume
            </Link>
            <ManualPortfolioButton />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireActiveUser();
  const params = await searchParams;
  const requestedPortfolioId = searchValue(params.portfolio);
  const result = await getPortfolioWorkspace(user.userId, requestedPortfolioId);

  if (result.status === "empty") {
    return (
      <WorkspaceMessage
        description="Upload a resume for assisted extraction or start with a blank portfolio and enter your information manually."
        title="Create your first portfolio"
      />
    );
  }
  if (result.status === "error") {
    return (
      <WorkspaceMessage
        description="Your portfolios could not be loaded. Please try again shortly."
        title="Portfolio Overview unavailable"
      />
    );
  }
  if (result.status === "unavailable") {
    return (
      <WorkspaceMessage
        description="The requested portfolio does not exist or is not available to this account. Choose one of your own portfolios."
        portfolios={result.portfolios}
        title="Portfolio unavailable"
      />
    );
  }

  const { deployment, portfolio, portfolios } = result;
  const deploymentOverview =
    deployment.status === "ready" ? deployment.overview : null;
  const isPublished =
    portfolio.status === "published" && Boolean(portfolio.publishedAt);
  const publicPath = isPublished ? `/p/${portfolio.slug}` : null;
  const score = scorePortfolio(portfolio.draftContent);
  const portfolioQuery = `portfolio=${encodeURIComponent(portfolio.id)}`;
  const showPublishedSuccess =
    searchValue(params.published) === "1" && isPublished;

  return (
    <main className="min-w-0 flex-1 bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {showPublishedSuccess ? (
          <PublishedSuccessBanner version={deploymentOverview?.deployment.version} />
        ) : null}

        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Portfolio Overview
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {portfolio.title}
              </h1>
              <Badge
                className="capitalize"
                variant={isPublished ? "default" : "secondary"}
              >
                {portfolio.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Theme: {portfolio.theme?.name ?? "Not selected"}
            </p>
          </div>
          <PortfolioChooser portfolios={portfolios} selectedId={portfolio.id} />
        </header>

        <section aria-label="Portfolio actions" className="flex flex-wrap gap-2">
          <Link
            className={buttonVariants()}
            href={`/dashboard/editor?${portfolioQuery}`}
          >
            <Pencil aria-hidden="true" />
            Edit Portfolio
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/themes?${portfolioQuery}`}
          >
            <Palette aria-hidden="true" />
            Change Theme
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/themes?${portfolioQuery}`}
          >
            <Rocket aria-hidden="true" />
            {isPublished ? "Republish" : "Publish"}
          </Link>
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href={`/dashboard/analytics?${portfolioQuery}`}
          >
            <BarChart3 aria-hidden="true" />
            Analytics
          </Link>
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href={`/dashboard/export?${portfolioQuery}`}
          >
            <Download aria-hidden="true" />
            Export
          </Link>
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href={`/dashboard/deployments?${portfolioQuery}`}
          >
            <History aria-hidden="true" />
            Deployment details
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} href="/upload">
            <FileUp aria-hidden="true" />
            New Portfolio
          </Link>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
          <Card>
            <CardHeader>
              <CardTitle><h2>Public Portfolio</h2></CardTitle>
              <CardDescription>
                {publicPath
                  ? "This published snapshot is publicly visible. Draft edits remain private until you republish."
                  : "This draft has no public link yet. Choose a theme and publish when it is ready."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {publicPath ? (
                <DeploymentActions publicPath={publicPath} />
              ) : (
                <Link className={buttonVariants()} href={`/themes?${portfolioQuery}`}>
                  Choose theme and publish
                  <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><h2>Current state</h2></CardTitle>
              <CardDescription>Real saved portfolio and deployment values.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Metadata label="Visibility" value={portfolio.status} />
                <Metadata
                  label="Theme"
                  value={portfolio.theme?.name ?? "Not selected"}
                />
                <Metadata
                  label="Deployment version"
                  value={
                    deploymentOverview
                      ? `Version ${deploymentOverview.deployment.version}`
                      : "Not deployed"
                  }
                />
                <Metadata label="Created" value={formatTimestamp(portfolio.createdAt)} />
                <Metadata label="Updated" value={formatTimestamp(portfolio.updatedAt)} />
                <Metadata label="Published" value={formatTimestamp(portfolio.publishedAt)} />
              </dl>
            </CardContent>
          </Card>
        </div>

        <PortfolioScoreCard result={score} />
        <UpgradePlanCard portfolioId={portfolio.id} />

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarClock aria-hidden="true" className="size-3.5" />
          Score is recalculated from the current draft whenever this page loads.
        </p>
      </div>
    </main>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium capitalize">{value}</dd>
    </div>
  );
}
