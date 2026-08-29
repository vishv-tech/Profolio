import { definePavniTheme } from "../types";

export const monoEchoManifest = definePavniTheme({
  layoutKey: "pavni-mono-echo",
  name: "Mono Echo",
  description: "A sharp monochrome portfolio built from repeating type, clean grids, and quiet depth.",
  category: "Design",
  careerTags: ["designer", "creative professional", "art director"],
  styleTags: ["monochrome", "editorial", "typographic"],
  component: () => import("./MonoEchoTheme"),
});
