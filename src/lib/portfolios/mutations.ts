import "server-only";

import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import { toDatabaseJson } from "@/lib/resumes/json";
import { createClient } from "@/lib/supabase/server";
import type { PortfolioData } from "@/types/portfolio";

type SaveReviewedResumeAsDraftInput = {
  content: PortfolioData;
  resumeId: string;
  slugBase: string;
  title: string;
};

export async function saveReviewedResumeAsDraft({
  content,
  resumeId,
  slugBase,
  title,
}: SaveReviewedResumeAsDraftInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("save_resume_review_as_draft", {
      p_draft_content: toDatabaseJson(content),
      p_resume_id: resumeId,
      p_slug_base: slugBase,
      p_title: title,
    })
    .single();

  if (error || !data) {
    logPortfolioDatabaseError("save-draft", error);
    return null;
  }

  return data;
}
