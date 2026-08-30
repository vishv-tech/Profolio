import { defineCareerTheme } from "../types";

export const financeCaManifest = defineCareerTheme({
  layoutKey: "career-finance-ca",
  name: "Ledger Profile",
  description: "A formal ledger-inspired professional report for finance, accounting, audit, and credentials.",
  category: "Finance",
  careerTags: ["chartered accountant", "finance", "audit", "investment"],
  styleTags: ["ledger", "formal", "report", "credential-led"],
  component: () => import("./FinanceCaTheme"),
});
