import { definePavniTheme } from "../types";

export const retroDesktopManifest = definePavniTheme({
  layoutKey: "pavni-retro-desktop",
  name: "Retro Desktop",
  description: "A nostalgic desktop portfolio with tactile windows and pixel-era details.",
  category: "Experimental",
  careerTags: ["creative professional", "developer", "designer", "general portfolio"],
  styleTags: ["retro", "desktop", "interactive", "nostalgic"],
  component: () => import("./RetroDesktopTheme"),
});
