import "server-only";

import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import { createManualPortfolioDraftInsert } from "@/lib/portfolios/draft-insert";
import { createPortfolioSlugCandidate } from "@/lib/portfolios/slug";
import { toDatabaseJson } from "@/lib/resumes/json";
import { createClient } from "@/lib/supabase/server";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { PortfolioData } from "@/types/portfolio";

type CreatePortfolioDraftInput = {
  content: PortfolioData;
  slugBase: string;
  title: string;
  userId: string;
} & (
  | { source: "manual" }
  | { source: "resume"; resumeId: string }
);

export type CreatedPortfolioDraft = {
  created: boolean;
  portfolioId: string;
  slug: string;
  status: string;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function findExistingPortfolio(
  supabase: ServerSupabaseClient,
  userId: string,
  content: PortfolioData,
) {
  const serializedContent = JSON.stringify(toDatabaseJson(content));
  const result = await supabase
    .from("portfolios")
    .select("id, slug, status")
    .eq("user_id", userId)
    .eq("status", "draft")
    .filter("draft_content", "eq", serializedContent)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    logPortfolioDatabaseError("create-draft-existing", result.error);
    return { ok: false as const, portfolio: null };
  }

  return { ok: true as const, portfolio: result.data };
}

export async function createPortfolioDraft(
  input: CreatePortfolioDraftInput,
): Promise<CreatedPortfolioDraft | null> {
  const { content, source, slugBase, title, userId } = input;
  const parsedContent = PortfolioDataSchema.safeParse(content);

  if (!parsedContent.success) {
    return null;
  }

  const supabase = await createClient();

  if (source === "resume") {
    const { data, error } = await supabase
      .rpc("save_resume_review_as_draft", {
        p_draft_content: toDatabaseJson(parsedContent.data),
        p_resume_id: input.resumeId,
        p_slug_base: slugBase,
        p_title: title,
      })
      .single();

    if (error || !data) {
      logPortfolioDatabaseError("save-draft", error);
      return null;
    }

    return {
      created: false,
      portfolioId: data.portfolio_id,
      slug: data.portfolio_slug,
      status: data.portfolio_status,
    };
  }

  const existing = await findExistingPortfolio(
    supabase,
    userId,
    parsedContent.data,
  );

  if (!existing.ok) {
    return null;
  }

  if (existing.portfolio) {
    return {
      created: false,
      portfolioId: existing.portfolio.id,
      slug: existing.portfolio.slug,
      status: existing.portfolio.status,
    };
  }

  for (let collisionNumber = 1; collisionNumber <= 100; collisionNumber += 1) {
    const slug = createPortfolioSlugCandidate(slugBase, collisionNumber);
    const result = await supabase
      .from("portfolios")
      .insert(
        createManualPortfolioDraftInsert({
          content: parsedContent.data,
          slug,
          title,
          userId,
        }),
      )
      .select("id, slug, status")
      .single();

    if (!result.error && result.data) {
      return {
        created: true,
        portfolioId: result.data.id,
        slug: result.data.slug,
        status: result.data.status,
      };
    }

    if (result.error?.code !== "23505") {
      logPortfolioDatabaseError("create-draft-insert", result.error);
      return null;
    }

    // A concurrent double-submit can race the first ownership lookup. If the
    // other request created this user's draft, converge on it instead of
    // creating a second portfolio with a suffixed slug.
    const concurrentExisting = await findExistingPortfolio(
      supabase,
      userId,
      parsedContent.data,
    );
    if (!concurrentExisting.ok) {
      return null;
    }
    if (concurrentExisting.portfolio) {
      return {
        created: false,
        portfolioId: concurrentExisting.portfolio.id,
        slug: concurrentExisting.portfolio.slug,
        status: concurrentExisting.portfolio.status,
      };
    }
  }

  return null;
}
