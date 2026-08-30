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
    <main className="flex flex-1 bg-muted/30 px-4 py-10 sm:px-6">
      <Card className="mx-auto h-fit w-full max-w-2xl">
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
    <main className="min-w-0 flex-1 bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Pencil aria-hidden="true" className="size-4" />
              Saved draft editor
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {portfolio.title}
              </h1>
              <Badge className="capitalize" variant="secondary">
                {portfolio.status}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manual and accepted AI edits update only the draft. The public
              snapshot changes only after you republish.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
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
