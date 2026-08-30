import { defineCareerTheme } from "../types";

export const electricalEngineerManifest = defineCareerTheme({
  layoutKey: "career-electrical-engineer",
  name: "Circuit Brief",
  description: "An energized circuit board with flowing signal paths, illuminated nodes, and modular technical panels.",
  category: "Engineering",
  careerTags: ["electrical engineer", "electronics", "embedded systems", "power systems"],
  styleTags: ["circuit flow", "electric pulse", "schematic", "modular grid"],
  component: () => import("./ElectricalEngineerTheme"),
});
