import { definePavniTheme } from "../types";

export const geoSignalManifest = definePavniTheme({
  layoutKey: "pavni-geo-signal",
  name: "Geo Signal",
  description: "A bright geometric portfolio combining bold type, lively signals, and a gallery-like portrait panel.",
  category: "Design",
  careerTags: ["visual designer", "product designer", "creative professional"],
  styleTags: ["geometric", "grid", "bold", "colorful"],
  component: () => import("./GeoSignalTheme"),
});
