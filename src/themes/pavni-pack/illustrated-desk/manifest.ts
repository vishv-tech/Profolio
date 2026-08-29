import { definePavniTheme } from "../types";

export const illustratedDeskManifest = definePavniTheme({
  layoutKey: "pavni-illustrated-desk",
  name: "Illustrated Desk",
  description: "A warm illustrated workspace with tactile objects and learning blocks.",
  category: "Creative",
  careerTags: ["designer", "developer", "educator", "creative"],
  styleTags: ["illustrated", "warm", "playful", "workspace"],
  component: () => import("./IllustratedDeskTheme"),
});
