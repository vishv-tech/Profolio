import "server-only";

import { PortfolioIdSchema } from "@/lib/portfolios/contracts";
import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import {
  buildDeploymentOverview,
  CurrentDeploymentRowSchema,
  type DeploymentOverviewResult,
} from "@/lib/portfolios/deployment-overview-model";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getOwnedPortfolioDeploymentOverview(
  portfolioId: string,
  userId: string,
): Promise<DeploymentOverviewResult> {
  const parsedId = PortfolioIdSchema.safeParse(portfolioId);

  if (!parsedId.success) {
    return { status: "unavailable" };
  }

  const supabase = await createClient();
  const portfolioResult = await supabase
    .from("portfolios")
    .select("id, title, slug, status, published_at")
    .eq("id", parsedId.data)
    .eq("user_id", userId)
    .maybeSingle();

  if (portfolioResult.error || !portfolioResult.data) {
    logPortfolioDatabaseError(
      "deployment-overview-portfolio",
      portfolioResult.error,
      parsedId.data,
    );
    return { status: "unavailable" };
  }

  const publicationState = buildDeploymentOverview({
    deployment: null,
    portfolio: portfolioResult.data,
    theme: null,
  });

  if (publicationState.status !== "unavailable") {
    return publicationState;
  }

  const deploymentResult = await supabase
    .from("deployments")
    .select("id, portfolio_id, version, status, theme_id, created_at")
    .eq("portfolio_id", parsedId.data)
    .eq("status", "current")
    .maybeSingle();

  if (deploymentResult.error || !deploymentResult.data) {
    logPortfolioDatabaseError(
      "deployment-overview-current",
      deploymentResult.error,
      parsedId.data,
    );
    return { status: "unavailable" };
  }

  const parsedDeployment = CurrentDeploymentRowSchema.safeParse(
    deploymentResult.data,
  );

  if (!parsedDeployment.success) {
    return { status: "unavailable" };
  }

  // Ownership is established above by the user's RLS-scoped portfolio and
  // deployment reads. The privileged client is used only for global theme
  // metadata so an already-published theme remains identifiable if archived.
  const themeResult = await createAdminClient()
    .from("themes")
    .select("id, name, layout_key")
    .eq("id", parsedDeployment.data.theme_id)
    .maybeSingle();

  if (themeResult.error || !themeResult.data) {
    logPortfolioDatabaseError(
      "deployment-overview-theme",
      themeResult.error,
      parsedId.data,
    );
    return { status: "unavailable" };
  }

  return buildDeploymentOverview({
    deployment: parsedDeployment.data,
    portfolio: portfolioResult.data,
    theme: themeResult.data,
  });
}
