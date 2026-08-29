import { definePavniTheme } from "../types";

export const navyPitchManifest = definePavniTheme({
  layoutKey: "pavni-navy-pitch",
  name: "Navy Pitch",
  description: "A bold navy portfolio with oversized editorial type and an image-led centre stage.",
  category: "Creative",
  careerTags: ["creative director", "designer", "consultant"],
  styleTags: ["navy", "pitch deck", "editorial", "image led"],
  component: () => import("./NavyPitchTheme"),
});
