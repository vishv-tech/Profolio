import { defineCareerTheme } from "../types";

export const legalProfessionalManifest = defineCareerTheme({
  layoutKey: "career-legal-professional",
  name: "Counsel Profile",
  description: "A restrained legal brief with editorial typography, citations, and clear experience hierarchy.",
  category: "Legal",
  careerTags: ["lawyer", "legal counsel", "advocate", "compliance"],
  styleTags: ["legal brief", "editorial", "formal", "reading-focused"],
  component: () => import("./LegalProfessionalTheme"),
});
