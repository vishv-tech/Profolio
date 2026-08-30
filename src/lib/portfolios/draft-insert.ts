import { toDatabaseJson } from "@/lib/resumes/json";
import type { Database } from "@/types/database";
import type { PortfolioData } from "@/types/portfolio";

type PortfolioInsert = Database["public"]["Tables"]["portfolios"]["Insert"];

export function createManualPortfolioDraftInsert({
  content,
  slug,
  title,
  userId,
}: {
  content: PortfolioData;
  slug: string;
  title: string;
  userId: string;
}): PortfolioInsert {
  return {
    draft_content: toDatabaseJson(content),
    slug,
    title: title.trim() || "Portfolio",
    user_id: userId,
  };
}
