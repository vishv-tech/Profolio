import { definePavniTheme } from "../types";

export const sageTerminalManifest = definePavniTheme({
  layoutKey: "pavni-sage-terminal",
  name: "Sage Terminal",
  description: "An earthy green studio portfolio with a circular portrait terminal and quiet tactile motion.",
  category: "Technology",
  careerTags: ["developer", "product designer", "researcher", "systems professional"],
  styleTags: ["sage", "terminal", "organic", "grid"],
  component: () => import("./SageTerminalTheme"),
});
