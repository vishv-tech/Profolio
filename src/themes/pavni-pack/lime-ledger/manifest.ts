import { definePavniTheme } from "../types";

export const limeLedgerManifest = definePavniTheme({
  layoutKey: "pavni-lime-ledger",
  name: "Lime Ledger",
  description: "A high-contrast editorial portfolio with punchy lime blocks, a photo-led masthead, and precise motion.",
  category: "Design",
  careerTags: ["product designer", "front-end developer", "design systems"],
  styleTags: ["high contrast", "lime", "grid", "editorial"],
  component: () => import("./LimeLedgerTheme"),
});
