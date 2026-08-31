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

import workspaceStyles from "@/components/workspace/workspace.module.css";
import styles from "./dashboard-overview.module.css";

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
    <form className={styles.chooser} method="get">
      <label htmlFor="portfolio">
        Portfolio
      </label>
      <div className={styles.chooserRow}>
        <select
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
        <button className={`${buttonVariants()} ${styles.chooserButton}`} type="submit">
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
    <main className={`${workspaceStyles.page} ${workspaceStyles.applicationSurface} ${styles.emptyMain}`}>
      <Card className={styles.emptyCard}>
        <CardHeader>
          <div className={workspaceStyles.emptyIcon}>
            <Rocket aria-hidden="true" className="size-5" />
          </div>
          <p className={workspaceStyles.eyebrow}>Start your portfolio</p>
          <CardTitle><h1 className={styles.emptyTitle}>{title}</h1></CardTitle>
          <CardDescription className="leading-6">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <PortfolioChooser portfolios={portfolios} />
          <div className={styles.emptyOptions}>
            <Link className={styles.emptyOption} href="/upload">
              <span className={styles.emptyOptionIcon}><FileUp aria-hidden="true" /></span>
              <span>
                <strong>Upload Resume</strong>
                <span>Start with assisted extraction from your PDF.</span>
              </span>
            </Link>
            <ManualPortfolioButton className={`${styles.manualOption}`} />
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
    <main className={`${workspaceStyles.page} ${workspaceStyles.applicationSurface}`}>
      <div className={`${workspaceStyles.container} space-y-6`}>
        {showPublishedSuccess ? (
          <PublishedSuccessBanner version={deploymentOverview?.deployment.version} />
        ) : null}

        <header className={styles.overviewHeader}>
          <div>
            <p className={workspaceStyles.eyebrow}>Your workspace</p>
            <h1 className={styles.headerTitle}>Your portfolio workspace.</h1>
            <p className={styles.headerText}>
              Keep your story polished, choose how it looks, and share the latest version when you are ready.
            </p>
          </div>
          <PortfolioChooser portfolios={portfolios} selectedId={portfolio.id} />
        </header>

        <section aria-label="Portfolio actions" className={styles.actionBar}>
          <div className={styles.primaryActions}>
            <Link
            className={`${buttonVariants()} ${styles.primaryButton}`}
            href={`/dashboard/editor?${portfolioQuery}`}
          >
            <Pencil aria-hidden="true" />
            Edit Portfolio
          </Link>
          <Link
            className={`${buttonVariants({ variant: "outline" })} ${styles.secondaryButton}`}
            href={`/themes?${portfolioQuery}`}
          >
            <Palette aria-hidden="true" />
            Change Theme
          </Link>
          <Link
            className={`${buttonVariants({ variant: "outline" })} ${styles.secondaryButton}`}
            href={`/themes?${portfolioQuery}`}
          >
            <Rocket aria-hidden="true" />
            {isPublished ? "Republish" : "Publish"}
          </Link>
          </div>
          <div className={styles.utilityActions}>
          <Link
            className={`${buttonVariants({ variant: "ghost" })} ${styles.utilityButton}`}
            href={`/dashboard/analytics?${portfolioQuery}`}
          >
            <BarChart3 aria-hidden="true" />
            Analytics
          </Link>
          <Link
            className={`${buttonVariants({ variant: "ghost" })} ${styles.utilityButton}`}
            href={`/dashboard/export?${portfolioQuery}`}
          >
            <Download aria-hidden="true" />
            Export
          </Link>
          <Link
            className={`${buttonVariants({ variant: "ghost" })} ${styles.utilityButton}`}
            href={`/dashboard/deployments?${portfolioQuery}`}
          >
            <History aria-hidden="true" />
            Deployment details
          </Link>
          <Link className={`${buttonVariants({ variant: "ghost" })} ${styles.utilityButton}`} href="/upload">
            <FileUp aria-hidden="true" />
            New Portfolio
          </Link>
          </div>
        </section>

        <div className={styles.portfolioGrid}>
          <Card className={styles.portfolioHero}>
            <CardHeader>
              <div className={styles.portfolioHeader}>
                <div>
                  <p className={workspaceStyles.eyebrow}>Current portfolio</p>
                  <CardTitle><h2 className={styles.portfolioName}>{portfolio.title}</h2></CardTitle>
                  <p className={styles.themeLine}>Theme · {portfolio.theme?.name ?? "Not selected"}</p>
                </div>
                <Badge className="capitalize" variant={isPublished ? "default" : "secondary"}>
                  {portfolio.status}
                </Badge>
              </div>
              <CardDescription>
                {publicPath
                  ? "This published snapshot is publicly visible. Draft edits remain private until you republish."
                  : "This draft has no public link yet. Choose a theme and publish when it is ready."}
              </CardDescription>
            </CardHeader>
            <CardContent className={styles.publicArea}>
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

          <Card className={styles.stateCard}>
            <CardHeader>
              <CardTitle><h2>Current state</h2></CardTitle>
              <CardDescription>Real saved portfolio and deployment values.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className={styles.metadataGrid}>
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

        <p className={styles.finePrint}>
          <CalendarClock aria-hidden="true" className="size-3.5" />
          Score is recalculated from the current draft whenever this page loads.
        </p>
      </div>
    </main>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metadataItem}>
      <dt>{label}</dt>
      <dd className="capitalize">{value}</dd>
    </div>
  );
}
