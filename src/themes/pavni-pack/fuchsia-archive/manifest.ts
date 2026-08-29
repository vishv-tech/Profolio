import { definePavniTheme } from "../types";

export const fuchsiaArchiveManifest = definePavniTheme({
  layoutKey: "pavni-fuchsia-archive",
  name: "Fuchsia Archive",
  description: "A playful fuchsia collage portfolio with a floating photo card and tactile responsive interactions.",
  category: "Creative",
  careerTags: ["designer", "artist", "content creator", "general portfolio"],
  styleTags: ["fuchsia", "collage", "archive", "playful"],
  component: () => import("./FuchsiaArchiveTheme"),
});
