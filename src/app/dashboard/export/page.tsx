import { ArrowLeft, Download, FileJson, FileText, FileUp } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireActiveUser } from "@/lib/auth/guards";
import { getExportWorkspace } from "@/lib/export/queries";

type ExportPageProps = {
  searchParams: Promise<{ portfolio?: string | string[] }>;
};

function ExportMessage({
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

export default async function ExportPage({ searchParams }: ExportPageProps) {
  const user = await requireActiveUser();
  const params = await searchParams;
  const portfolioId = typeof params.portfolio === "string" ? params.portfolio : null;
  const result = await getExportWorkspace(user.userId, portfolioId);

  return (
    <main className="flex flex-1 bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Download aria-hidden="true" className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Export portfolio</h1>
            <p className="text-sm text-muted-foreground">
              Save a print-ready PDF or download portable portfolio data.
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/dashboard">
            <ArrowLeft aria-hidden="true" /> Dashboard
          </Link>
        </header>

        {result.status === "empty" ? (
          <ExportMessage
            description="Create a portfolio before using the export tools."
            showUpload
            title="No portfolios yet"
          />
        ) : result.status === "error" ? (
          <ExportMessage
            description="Your portfolios could not be loaded. Please try again shortly."
            title="Export unavailable"
          />
        ) : result.status === "unavailable" ? (
          <ExportMessage
            description="The requested portfolio is unavailable to this account."
            title="Portfolio unavailable"
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
                      defaultValue={result.selectedId}
                      id="portfolio"
                      name="portfolio"
                    >
                      {result.portfolios.map((portfolio) => (
                        <option key={portfolio.id} value={portfolio.id}>
                          {portfolio.title} ({portfolio.status})
                        </option>
                      ))}
                    </select>
                    <button className={buttonVariants()} type="submit">Choose</button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {result.selection.status === "unavailable" ? (
              <ExportMessage
                description="The requested portfolio is unavailable to this account."
                title="Portfolio unavailable"
              />
            ) : result.selection.status === "invalid-content" ? (
              <ExportMessage
                description="Review and save this portfolio again before exporting it."
                title="Portfolio data needs review"
              />
            ) : result.selection.status === "theme-required" ? (
              <Card>
                <CardHeader>
                  <CardTitle><h2>Choose a theme first</h2></CardTitle>
                  <CardDescription>
                    A selected coded theme is required for a faithful print export and portable theme configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    className={buttonVariants()}
                    href={`/themes?portfolio=${result.selectedId}`}
                  >
                    Choose theme
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle><h2>{result.selection.portfolio.title}</h2></CardTitle>
                    <CardDescription>
                      Theme: {result.selection.portfolio.themeName} · Status:{" "}
                      <span className="capitalize">{result.selection.portfolio.status}</span>
                    </CardDescription>
                  </CardHeader>
                </Card>

                <section aria-label="Export options" className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <FileText aria-hidden="true" className="size-5" />
                      </div>
                      <CardTitle><h2>PDF</h2></CardTitle>
                      <CardDescription>
                        Open the selected theme in a private print view, then choose Save as PDF in your browser.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link
                        className={buttonVariants()}
                        href={`/export/${result.selectedId}/print`}
                        target="_blank"
                      >
                        Export PDF
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <FileJson aria-hidden="true" className="size-5" />
                      </div>
                      <CardTitle><h2>Portfolio data</h2></CardTitle>
                      <CardDescription>
                        Download validated PortfolioData, ThemeConfig, and portable portfolio metadata as JSON.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <a
                        className={buttonVariants({ variant: "outline" })}
                        download
                        href={`/api/export/${result.selectedId}`}
                      >
                        Download JSON
                      </a>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
