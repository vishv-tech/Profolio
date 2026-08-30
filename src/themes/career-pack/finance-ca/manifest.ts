import { defineCareerTheme } from "../types";

export const financeCaManifest = defineCareerTheme({
  layoutKey: "career-finance-ca",
  name: "Ledger Profile",
  description: "A premium financial statement with ledger rhythm, analytical signals, and credential-led reporting.",
  category: "Finance",
  careerTags: ["chartered accountant", "finance", "audit", "investment"],
  styleTags: ["ledger", "financial dashboard", "analytical", "credential-led"],
  component: () => import("./FinanceCaTheme"),
});
