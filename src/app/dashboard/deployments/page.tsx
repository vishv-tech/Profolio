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
    <main className="flex flex-1 bg-muted/30 px-4 py-10 sm:px-6">
      <Card className="mx-auto h-fit w-full max-w-2xl">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
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
      <main className="flex flex-1 bg-muted/30 px-4 py-10 sm:px-6">
        <Card className="mx-auto h-fit w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
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
    <main className="flex flex-1 bg-muted/30 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        {showPublishedSuccess ? (
          <div
            className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950"
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

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Rocket aria-hidden="true" className="size-4" />
            Current deployment
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {overview.portfolio.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Published portfolio and deployment information
              </p>
            </div>
            <Badge className="bg-emerald-600 text-white">Ready</Badge>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
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

            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Layers3 aria-hidden="true" className="size-3.5" />
                  Version
                </dt>
                <dd className="mt-2 font-semibold">
                  Version {overview.deployment.version}
                </dd>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Palette aria-hidden="true" className="size-3.5" />
                  Theme
                </dt>
                <dd className="mt-2 font-semibold">{overview.theme.name}</dd>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Eye aria-hidden="true" className="size-3.5" />
                  Visibility
                </dt>
                <dd className="mt-2 font-semibold">Public</dd>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CalendarClock aria-hidden="true" className="size-3.5" />
                  Published
                </dt>
                <dd className="mt-2 font-semibold">
                  <time dateTime={overview.portfolio.publishedAt}>
                    {formatTimestamp(overview.portfolio.publishedAt)}
                  </time>
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
