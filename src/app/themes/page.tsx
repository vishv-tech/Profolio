import { ArrowRight, FileUp, Palette } from "lucide-react";
import Link from "next/link";

import { ProtectedHeader } from "@/components/auth/protected-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireActiveUser } from "@/lib/auth/guards";
import { buildThemeStoreCatalog, resolveThemeLayoutKey } from "@/lib/themes/store";
import { getOwnedThemeStorePortfolio } from "@/lib/themes/store-queries";
import { getThemeManifest } from "@/themes/registry";

import { ThemeStore } from "./ThemeStore";

type ThemesPageProps = {
  searchParams: Promise<{
    portfolio?: string | string[];
    theme?: string | string[];
  }>;
};

function ThemeStoreMessage({
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
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Palette aria-hidden="true" className="size-5" />
          </div>
          <CardTitle>
            <h1 className="text-xl font-semibold">{title}</h1>
          </CardTitle>
          <CardDescription className="max-w-xl leading-6">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link className={buttonVariants()} href="/upload">
            <FileUp aria-hidden="true" />
            Create from a resume
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/dashboard"
          >
            Back to dashboard
            <ArrowRight aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function ThemesPage({ searchParams }: ThemesPageProps) {
  const user = await requireActiveUser();
  const params = await searchParams;
  const portfolioId =
    typeof params.portfolio === "string" ? params.portfolio : null;
  const requestedLayoutKey =
    typeof params.theme === "string" ? params.theme : undefined;

  let content;

  if (!portfolioId) {
    content = (
      <ThemeStoreMessage
        description="Open the Theme Store after saving a reviewed resume so the page has a specific private draft to preview. No sample portfolio is substituted here."
        title="Choose or create a portfolio first"
      />
    );
  } else {
    const result = await getOwnedThemeStorePortfolio(
      portfolioId,
      user.userId,
    );

    if (result.status === "unavailable") {
      content = (
        <ThemeStoreMessage
          description="The requested portfolio does not exist or is not available to this account. Return to your workspace and choose one of your own drafts."
          title="Portfolio unavailable"
        />
      );
    } else if (result.status === "invalid-draft") {
      content = (
        <ThemeStoreMessage
          description="This draft does not match the current portfolio data contract. Review and save the resume data again before choosing a theme."
          title="Review this portfolio again"
        />
      );
    } else {
      const savedTheme = result.databaseThemes.find(
        (theme) => theme.id === result.portfolio.themeId,
      );
      const savedLayoutKey = savedTheme
        ? getThemeManifest(savedTheme.layout_key)?.layoutKey ?? null
        : null;
      const catalog = buildThemeStoreCatalog({
        databaseThemes: result.databaseThemes,
        savedThemeConfig: result.portfolio.themeConfig,
        savedThemeId: result.portfolio.themeId,
      });
      const initialLayoutKey = resolveThemeLayoutKey(
        requestedLayoutKey,
        savedLayoutKey,
      );

      content = initialLayoutKey ? (
        <ThemeStore
          catalog={catalog}
          initialLayoutKey={initialLayoutKey}
          initialSavedLayoutKey={savedLayoutKey}
          key={initialLayoutKey}
          metadataReadFailed={result.metadataReadFailed}
          portfolioData={result.portfolio.draftContent}
          portfolioId={result.portfolio.id}
          portfolioTitle={result.portfolio.title}
        />
      ) : (
        <ThemeStoreMessage
          description="No coded portfolio themes are registered in this build."
          title="No themes available"
        />
      );
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <ProtectedHeader
        destination={user.profile.role === "admin" ? "/admin" : "/dashboard"}
        email={user.email}
        label={user.profile.role === "admin" ? "Admin workspace" : "User workspace"}
      />
      {content}
    </div>
  );
}
