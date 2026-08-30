import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/export/PrintButton";
import { buttonVariants } from "@/components/ui/button";
import { requireActiveUser } from "@/lib/auth/guards";
import { getOwnedPortfolioForExport } from "@/lib/export/queries";
import { loadThemeComponent } from "@/themes";

import styles from "./print.module.css";

export default async function PrintPortfolioPage({
  params,
}: {
  params: Promise<{ portfolioId: string }>;
}) {
  const user = await requireActiveUser();
  const { portfolioId } = await params;
  const result = await getOwnedPortfolioForExport(portfolioId, user.userId);

  if (result.status !== "ready") notFound();

  const Theme = await loadThemeComponent(result.portfolio.layoutKey);
  if (!Theme) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.controls}>
        <div>
          <p className="font-medium">{result.portfolio.title}</p>
          <p className="text-xs text-muted-foreground">
            Browser print preview · choose Save as PDF
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/dashboard/export?portfolio=${portfolioId}`}
          >
            <ArrowLeft aria-hidden="true" /> Back to Export
          </Link>
          <PrintButton />
        </div>
      </div>
      <div className={styles.canvas}>
        <Theme config={result.portfolio.themeConfig} data={result.portfolio.data} />
      </div>
    </main>
  );
}
