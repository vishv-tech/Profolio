import { defineCareerTheme } from "../types";

export const productDesignerManifest = defineCareerTheme({
  layoutKey: "career-product-designer",
  name: "Product Casebook",
  description: "A product casebook for selected work, design process, outcomes, and experience-led storytelling.",
  category: "Design",
  careerTags: ["product designer", "UX designer", "UI designer", "design researcher"],
  styleTags: ["case study", "product thinking", "process", "project-forward"],
  component: () => import("./ProductDesignerTheme"),
});
