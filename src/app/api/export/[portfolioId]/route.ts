import { requireActiveUser } from "@/lib/auth/guards";
import {
  portfolioExportFilename,
  serializePortfolioExport,
} from "@/lib/export/core";
import { getOwnedPortfolioForExport } from "@/lib/export/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ portfolioId: string }> },
) {
  const user = await requireActiveUser();
  const { portfolioId } = await params;
  const result = await getOwnedPortfolioForExport(portfolioId, user.userId);

  if (result.status !== "ready") {
    return Response.json({ message: "Portfolio unavailable." }, { status: 404 });
  }

  const body = serializePortfolioExport(result.portfolio);
  if (!body) {
    return Response.json(
      { message: "Export is temporarily unavailable." },
      { status: 500 },
    );
  }

  return new Response(body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${portfolioExportFilename(result.portfolio.title)}"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
