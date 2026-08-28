import "server-only";

type SafeDatabaseError = {
  code?: unknown;
};

export function logPortfolioDatabaseError(
  operation: string,
  error: unknown,
  portfolioId?: string,
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const databaseError: SafeDatabaseError =
    typeof error === "object" && error !== null ? error : {};

  console.error("[portfolio]", {
    operation,
    ...(portfolioId ? { portfolioId } : {}),
    code:
      typeof databaseError.code === "string"
        ? databaseError.code
        : "unknown",
  });
}
