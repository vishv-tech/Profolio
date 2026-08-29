import { definePavniTheme } from "../types";

export const coralCircuitManifest = definePavniTheme({
  layoutKey: "pavni-coral-circuit",
  name: "Coral Circuit",
  description: "A warm coral and dark-ink portfolio with an animated circuit grid and image-led feature card.",
  category: "Technology",
  careerTags: ["developer", "engineer", "product designer", "technical creative"],
  styleTags: ["coral", "circuit", "geometric", "bold"],
  component: () => import("./CoralCircuitTheme"),
});
