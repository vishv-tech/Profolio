import { definePavniTheme } from "../types";

export const creativeDeveloperManifest = definePavniTheme({
  layoutKey: "pavni-creative-developer",
  name: "Creative Developer",
  description: "Expressive typography on a code-inspired night-mode canvas.",
  category: "Technology",
  careerTags: ["developer", "engineer", "technologist", "designer"],
  styleTags: ["dark", "code-inspired", "grid", "neon"],
  component: () => import("./CreativeDeveloperTheme"),
});
