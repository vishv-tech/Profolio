import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Eye,
  Layers3,
  Palette,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeploymentActions } from "@/components/portfolio/deployment-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireActiveUser } from "@/lib/auth/guards";
import { getOwnedPortfolioDeploymentOverview } from "@/lib/portfolios/deployment-overview";

import workspaceStyles from "@/components/workspace/workspace.module.css";
import styles from "./deployments.module.css";

type DeploymentsPageProps = {
  searchParams: Promise<{
    portfolio?: string | string[];
    published?: string | string[];
  }>;
};

function searchValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function formatTimestamp(value: string): string {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function EmptyDeploymentOverview() {
  return (
    <main className={`${workspaceStyles.page} ${workspaceStyles.applicationSurface} ${styles.emptyMain}`}>
      <Card className={styles.emptyCard}>
        <CardHeader>
          <div className={workspaceStyles.emptyIcon}>
            <Rocket aria-hidden="true" className="size-5" />
          </div>
          <CardTitle>
            <h1 className="text-xl font-semibold">Deployment overview</h1>
          </CardTitle>
          <CardDescription className="max-w-xl leading-6">
            Publish a saved portfolio from the Theme Store to see its current
            deployment details here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link className={buttonVariants()} href="/dashboard">
            <ArrowLeft aria-hidden="true" />
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function DeploymentsPage({
  searchParams,
}: DeploymentsPageProps) {
  const user = await requireActiveUser();
  const params = await searchParams;
  const portfolioId = searchValue(params.portfolio);

  if (!portfolioId) {
    return <EmptyDeploymentOverview />;
  }

  const result = await getOwnedPortfolioDeploymentOverview(
    portfolioId,
    user.userId,
  );

  if (result.status === "unavailable") {
    notFound();
  }

  if (result.status === "unpublished") {
    return (
      <main className={`${workspaceStyles.page} ${workspaceStyles.applicationSurface} ${styles.emptyMain}`}>
        <Card className={styles.emptyCard}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className={workspaceStyles.emptyIcon}>
                <Rocket aria-hidden="true" className="size-5" />
              </div>
              <Badge variant="secondary">
                {result.portfolio.status === "private" ? "Private" : "Draft"}
              </Badge>
            </div>
            <CardTitle>
              <h1 className="text-xl font-semibold">{result.portfolio.title}</h1>
            </CardTitle>
            <CardDescription className="max-w-xl leading-6">
              This portfolio does not have a current public deployment. Select
              and save a theme before publishing it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link
              className={buttonVariants()}
              href={`/themes?portfolio=${encodeURIComponent(result.portfolio.id)}`}
            >
              Choose a theme
              <Palette aria-hidden="true" />
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/dashboard"
            >
              <ArrowLeft aria-hidden="true" />
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { overview } = result;
  const showPublishedSuccess = searchValue(params.published) === "1";

  return (
    <main className={`${workspaceStyles.page} ${workspaceStyles.applicationSurface}`}>
      <div className={`${workspaceStyles.narrowContainer} space-y-5`}>
        {showPublishedSuccess ? (
          <div
            className={styles.success}
            role="status"
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">Portfolio published successfully</p>
              <p className="mt-1 text-sm leading-6">
                Version {overview.deployment.version} is ready. Your workspace
                stays open until you choose to view the public site.
              </p>
            </div>
          </div>
        ) : null}

        <header className={styles.header}>
          <div>
          <div className={styles.headerLabel}>
            <Rocket aria-hidden="true" className="size-4" />
            Current deployment
          </div>
              <h1 className={styles.title}>
                {overview.portfolio.title}
              </h1>
              <p className={styles.description}>
                Published portfolio and deployment information
              </p>
          </div>
            <Badge className="bg-emerald-600 text-white">Ready</Badge>
        </header>

        <Card className={styles.deploymentCard}>
          <CardHeader className={`${styles.cardHeader} border-b`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>
                  <h2 className="text-lg font-semibold">Public portfolio</h2>
                </CardTitle>
                <CardDescription className="mt-1 leading-6">
                  The published snapshot is publicly visible at this address.
                </CardDescription>
              </div>
              <Badge variant="outline">Published</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <DeploymentActions publicPath={overview.portfolio.publicPath} />

            <dl className={styles.stats}>
              <div className={styles.stat}>
                <dt>
                  <Layers3 aria-hidden="true" className="size-3.5" />
                  Version
                </dt>
                <dd>
                  Version {overview.deployment.version}
                </dd>
              </div>
              <div className={styles.stat}>
                <dt>
                  <Palette aria-hidden="true" className="size-3.5" />
                  Theme
                </dt>
                <dd>{overview.theme.name}</dd>
              </div>
              <div className={styles.stat}>
                <dt>
                  <Eye aria-hidden="true" className="size-3.5" />
                  Visibility
                </dt>
                <dd>Public</dd>
              </div>
              <div className={styles.stat}>
                <dt>
                  <CalendarClock aria-hidden="true" className="size-3.5" />
                  Published
                </dt>
                <dd>
                  <time dateTime={overview.portfolio.publishedAt}>
                    {formatTimestamp(overview.portfolio.publishedAt)}
                  </time>
                </dd>
              </div>
            </dl>

            <div className={styles.footer}>
              <p>
                Deployment created{" "}
                <time dateTime={overview.deployment.createdAt}>
                  {formatTimestamp(overview.deployment.createdAt)}
                </time>
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={`/themes?portfolio=${encodeURIComponent(overview.portfolio.id)}`}
                >
                  Manage theme
                </Link>
                <Link
                  className={buttonVariants({ variant: "ghost" })}
                  href="/dashboard"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
