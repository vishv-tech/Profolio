import { defineCareerTheme } from "../types";

export const financeCaManifest = defineCareerTheme({
  layoutKey: "career-finance-ca",
  name: "Ledger Profile",
  description: "A restrained professional starter for finance and accounting careers.",
  category: "Finance",
  careerTags: ["chartered accountant", "finance", "audit", "investment"],
  styleTags: ["professional", "restrained", "report-like"],
  component: () => import("./FinanceCaTheme"),
});
