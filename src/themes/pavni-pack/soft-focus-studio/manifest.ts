import { definePavniTheme } from "../types";

export const softFocusStudioManifest = definePavniTheme({
  layoutKey: "pavni-soft-focus-studio",
  name: "Soft Focus Studio",
  description: "A layered editorial portfolio with luminous colour, a large image stage, and playful soft motion.",
  category: "Creative",
  careerTags: ["photographer", "art director", "designer"],
  styleTags: ["soft", "pastel", "editorial", "layered"],
  component: () => import("./SoftFocusStudioTheme"),
});
