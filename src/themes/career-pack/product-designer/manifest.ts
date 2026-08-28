import { defineCareerTheme } from "../types";

export const productDesignerManifest = defineCareerTheme({
  layoutKey: "career-product-designer",
  name: "Product Casebook",
  description: "A case-study-oriented starter for product and experience design.",
  category: "Design",
  careerTags: ["product designer", "UX designer", "UI designer", "design researcher"],
  styleTags: ["case-study", "spacious", "project-forward"],
  component: () => import("./ProductDesignerTheme"),
});
