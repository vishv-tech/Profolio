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

import workspaceStyles from "@/components/workspace/workspace.module.css";
import utilityStyles from "../dashboard-utilities.module.css";
import styles from "./export.module.css";

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

export default async function ExportPage({ searchParams }: ExportPageProps) {
  const user = await requireActiveUser();
  const params = await searchParams;
  const portfolioId = typeof params.portfolio === "string" ? params.portfolio : null;
  const result = await getExportWorkspace(user.userId, portfolioId);

  return (
    <main className={`${workspaceStyles.page} ${workspaceStyles.applicationSurface}`}>
      <div className={`${workspaceStyles.narrowContainer} space-y-6`}>
        <header className={utilityStyles.pageHeader}>
          <div>
            <div className={utilityStyles.headerIcon}>
              <Download aria-hidden="true" className="size-5" />
            </div>
            <p className={`${workspaceStyles.eyebrow} mt-4`}>Export</p>
            <h1 className={utilityStyles.title}>Take your portfolio with you.</h1>
            <p className={utilityStyles.description}>
              Create a print-ready PDF or keep a portable copy of your portfolio data.
            </p>
          </div>
          <Link className={`${buttonVariants({ variant: "outline" })} ${utilityStyles.backButton}`} href="/dashboard">
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
            <Card className={utilityStyles.selectorCard}>
              <CardContent className={utilityStyles.selectorContent}>
                <form className={utilityStyles.selectorForm} method="get">
                  <label htmlFor="portfolio">Portfolio</label>
                  <div className={utilityStyles.selectorRow}>
                    <select
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
                    <button className={`${buttonVariants()} ${utilityStyles.selectorButton}`} type="submit">Choose</button>
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
              <Card className={styles.themeRequired}>
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
                <Card className={styles.portfolioSummary}>
                  <CardHeader>
                    <CardTitle><h2 className={styles.portfolioTitle}>{result.selection.portfolio.title}</h2></CardTitle>
                    <CardDescription>
                      Theme: {result.selection.portfolio.themeName} · Status:{" "}
                      <span className="capitalize">{result.selection.portfolio.status}</span>
                    </CardDescription>
                  </CardHeader>
                </Card>

                <section aria-label="Export options" className={styles.options}>
                  <Card className={styles.optionCard}>
                    <CardHeader>
                      <div className={styles.optionIcon}>
                        <FileText aria-hidden="true" className="size-5" />
                      </div>
                      <CardTitle><h2 className={styles.optionTitle}>PDF portfolio</h2></CardTitle>
                      <CardDescription>
                        Create a print-ready version of your portfolio using your selected design.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link
                        className={`${buttonVariants()} ${styles.exportButton}`}
                        href={`/export/${result.selectedId}/print`}
                        target="_blank"
                      >
                        Export PDF
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className={styles.optionCard}>
                    <CardHeader>
                      <div className={styles.optionIcon}>
                        <FileJson aria-hidden="true" className="size-5" />
                      </div>
                      <CardTitle><h2 className={styles.optionTitle}>Portfolio data</h2></CardTitle>
                      <CardDescription>
                        Download a portable copy of your portfolio content and settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <a
                        className={`${buttonVariants({ variant: "outline" })} ${styles.downloadButton}`}
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
