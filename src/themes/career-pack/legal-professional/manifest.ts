import { defineCareerTheme } from "../types";

export const legalProfessionalManifest = defineCareerTheme({
  layoutKey: "career-legal-professional",
  name: "Counsel Profile",
  description: "A measured reading-focused starter for legal professionals.",
  category: "Legal",
  careerTags: ["lawyer", "legal counsel", "advocate", "compliance"],
  styleTags: ["formal", "editorial", "reading-focused"],
  component: () => import("./LegalProfessionalTheme"),
});
