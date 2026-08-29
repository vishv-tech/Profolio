import { definePavniTheme } from "../types";

export const midnightSunManifest = definePavniTheme({
  layoutKey: "pavni-midnight-sun",
  name: "Midnight Sun",
  description: "A vivid midnight-blue portfolio with a warm sun, circular portrait stage, and expressive editorial motion.",
  category: "Creative",
  careerTags: ["designer", "creative director", "strategist", "general portfolio"],
  styleTags: ["editorial", "midnight blue", "sun", "bold"],
  component: () => import("./MidnightSunTheme"),
});
