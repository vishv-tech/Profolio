import { ArrowLeft, FileUp, Pencil } from "lucide-react";
import Link from "next/link";

import { PortfolioDraftEditor } from "@/components/portfolio/portfolio-draft-editor";
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
import { getPortfolioWorkspace } from "@/lib/portfolios/workspace";

import workspaceStyles from "@/components/workspace/workspace.module.css";
import styles from "./editor.module.css";

type EditorPageProps = {
  searchParams: Promise<{ portfolio?: string | string[] }>;
};

function EditorMessage({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <main className={`${workspaceStyles.page} ${workspaceStyles.applicationSurface}`}>
      <Card className={styles.messageCard}>
        <CardHeader>
          <CardTitle><h1>{title}</h1></CardTitle>
          <CardDescription className="leading-6">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link className={buttonVariants()} href="/upload">
            <FileUp aria-hidden="true" />
            Upload Resume
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/dashboard"
          >
            <ArrowLeft aria-hidden="true" />
            Overview
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const user = await requireActiveUser();
  const params = await searchParams;
  const portfolioId =
    typeof params.portfolio === "string" ? params.portfolio : null;
  const result = await getPortfolioWorkspace(user.userId, portfolioId);

  if (result.status === "empty") {
    return (
      <EditorMessage
        description="Create a portfolio before opening the saved draft editor."
        title="No portfolio to edit"
      />
    );
  }
  if (result.status !== "ready") {
    return (
      <EditorMessage
        description="The requested portfolio is unavailable to this account."
        title="Portfolio unavailable"
      />
    );
  }

  const { portfolio } = result;
  return (
    <main className={`${workspaceStyles.page} ${workspaceStyles.applicationSurface}`}>
      <div className={`${workspaceStyles.narrowContainer} space-y-6`}>
        <header className={styles.header}>
          <div>
            <div className={workspaceStyles.eyebrow}>
              <Pencil aria-hidden="true" className="size-4" />
              Portfolio editor
            </div>
            <div className={styles.headingLine}>
              <h1 className={styles.title}>
                {portfolio.title}
              </h1>
              <Badge className="capitalize" variant="secondary">
                {portfolio.status}
              </Badge>
            </div>
            <p className={styles.description}>
              Shape each section of your draft. Your public portfolio changes only when you republish.
            </p>
          </div>
          <Link
            className={`${buttonVariants({ variant: "outline" })} ${styles.backButton}`}
            href={`/dashboard?portfolio=${encodeURIComponent(portfolio.id)}`}
          >
            <ArrowLeft aria-hidden="true" />
            Overview
          </Link>
        </header>

        <PortfolioDraftEditor
          initialContent={portfolio.draftContent}
          initialUpdatedAt={portfolio.updatedAt}
          portfolioId={portfolio.id}
        />
      </div>
    </main>
  );
}
