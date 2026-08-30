import { recordPublishedPortfolioView } from "@/lib/analytics/record";

const MAX_BODY_BYTES = 4096;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ message: "Unavailable." }, { status: 404 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ message: "Unavailable." }, { status: 404 });
  }

  const result = await recordPublishedPortfolioView(input);
  if (result === "recorded") return new Response(null, { status: 204 });
  if (result === "unavailable") {
    return Response.json({ message: "Unavailable." }, { status: 404 });
  }
  return Response.json(
    { message: "Analytics are temporarily unavailable." },
    { status: 503 },
  );
}
