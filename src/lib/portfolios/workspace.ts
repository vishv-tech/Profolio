import "server-only";

import { getOwnedPortfolioDeploymentOverview } from "@/lib/portfolios/deployment-overview";
import type { DeploymentOverviewResult } from "@/lib/portfolios/deployment-overview-model";
import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import {
  buildWorkspacePortfolio,
  parseWorkspaceChoices,
  resolveWorkspaceSelection,
  WorkspacePortfolioRowSchema,
  type WorkspacePortfolio,
  type WorkspacePortfolioChoice,
} from "@/lib/portfolios/workspace-model";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PortfolioWorkspaceResult =
  | { status: "empty" }
  | { status: "error" }
  | { status: "unavailable"; portfolios: WorkspacePortfolioChoice[] }
  | {
      status: "ready";
      portfolios: WorkspacePortfolioChoice[];
      portfolio: WorkspacePortfolio;
      deployment: DeploymentOverviewResult;
    };

export async function getPortfolioWorkspace(
  userId: string,
  requestedPortfolioId: string | null,
): Promise<PortfolioWorkspaceResult> {
  const supabase = await createClient();
  const choicesResult = await supabase
    .from("portfolios")
    .select("id, title, slug, status, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (choicesResult.error) {
    logPortfolioDatabaseError("workspace-list", choicesResult.error);
    return { status: "error" };
  }

  const portfolios = parseWorkspaceChoices(choicesResult.data ?? []);
  const selection = resolveWorkspaceSelection(portfolios, requestedPortfolioId);

  if (selection.status === "empty") return { status: "empty" };
  if (selection.status === "unavailable") return { status: "unavailable", portfolios };

  const portfolioResult = await supabase
    .from("portfolios")
    .select(
      "id, title, slug, status, updated_at, created_at, published_at, draft_content, theme_id",
    )
    .eq("id", selection.id)
    .eq("user_id", userId)
    .maybeSingle();
  const parsedRow = WorkspacePortfolioRowSchema.safeParse(portfolioResult.data);

  if (portfolioResult.error || !parsedRow.success) {
    logPortfolioDatabaseError("workspace-portfolio", portfolioResult.error, selection.id);
    return { status: "unavailable", portfolios };
  }

  let themeValue: unknown = null;
  if (parsedRow.data.theme_id) {
    // The owned portfolio read above establishes authorization. The existing
    // server-only privileged client is used only for global theme metadata so
    // an archived theme can still be named in its owner's workspace.
    const themeResult = await createAdminClient()
      .from("themes")
      .select("id, name, layout_key")
      .eq("id", parsedRow.data.theme_id)
      .maybeSingle();

    if (!themeResult.error) {
      themeValue = themeResult.data;
    } else {
      logPortfolioDatabaseError("workspace-theme", themeResult.error, selection.id);
    }
  }

  const portfolio = buildWorkspacePortfolio(parsedRow.data, themeValue);
  if (!portfolio) return { status: "unavailable", portfolios };

  return {
    status: "ready",
    portfolios,
    portfolio,
    deployment: await getOwnedPortfolioDeploymentOverview(selection.id, userId),
  };
}
