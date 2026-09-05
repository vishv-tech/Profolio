import "server-only";

export function isProfolioDemoMode(): boolean {
  return process.env.PROFOLIO_DEMO_MODE === "true";
}
