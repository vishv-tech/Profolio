import "server-only";

import { buildPortfolioViewEvent, PortfolioViewRequestSchema } from "@/lib/analytics/core";
import { getPublishedPortfolioBySlug } from "@/lib/portfolios/queries";
import { createAdminClient } from "@/lib/supabase/admin";

export type RecordViewResult = "recorded" | "unavailable" | "failed";

export async function recordPublishedPortfolioView(
  input: unknown,
): Promise<RecordViewResult> {
  const request = PortfolioViewRequestSchema.safeParse(input);
  if (!request.success) return "unavailable";

  const portfolio = await getPublishedPortfolioBySlug(request.data.slug);
  const event = portfolio
    ? buildPortfolioViewEvent(portfolio.id, request.data.referrer)
    : null;
  if (!event) return "unavailable";

  try {
    const { error } = await createAdminClient()
      .from("portfolio_events")
      .insert(event);
    if (error) {
      logViewError(error);
      return "failed";
    }
  } catch (error) {
    logViewError(error);
    return "failed";
  }

  return "recorded";
}

function logViewError(error: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "unknown";
  console.error("[analytics]", { operation: "record-view", code });
}
