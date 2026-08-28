import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { Json } from "@/types/database";
import type { PortfolioData } from "@/types/portfolio";

export function toDatabaseJson(value: unknown): Json {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toDatabaseJson);
  }

  if (typeof value === "object") {
    const output: { [key: string]: Json | undefined } = {};

    for (const [key, child] of Object.entries(value)) {
      if (child === undefined) {
        throw new TypeError("Undefined values cannot be stored as JSON.");
      }

      output[key] = toDatabaseJson(child);
    }

    return output;
  }

  throw new TypeError("The value cannot be stored as JSON.");
}

export function parseStoredPortfolio(value: Json | null): PortfolioData | null {
  const parsed = PortfolioDataSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
}
