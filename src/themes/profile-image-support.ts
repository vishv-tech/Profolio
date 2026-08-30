import type { CareerThemeLayoutKey } from "@/themes/career-pack/types";
import type { PavniThemeLayoutKey } from "@/themes/pavni-pack/types";

export type ActiveThemeLayoutKey =
  | CareerThemeLayoutKey
  | PavniThemeLayoutKey;

// This audit records themes whose existing design already includes a portrait,
// avatar, or profile-photo slot. It does not opt photo-free themes into a new
// visual treatment.
export const PROFILE_IMAGE_THEME_LAYOUT_KEYS = Object.freeze([
  "pavni-dynamic-bento",
  "pavni-creative-developer",
  "pavni-brown-red-scrapbook",
  "pavni-webverse-collage",
  "pavni-retro-desktop",
  "pavni-kinetic-gallery",
  "pavni-blue-beige-folders",
  "pavni-striped-notes",
  "pavni-color-cutout",
  "pavni-mono-echo",
  "pavni-navy-pitch",
  "pavni-orbit-sketch",
  "pavni-geo-signal",
  "pavni-noir-creator",
  "pavni-soft-focus-studio",
  "pavni-blue-red-script",
  "pavni-lime-ledger",
  "pavni-midnight-sun",
  "pavni-fuchsia-archive",
  "pavni-sage-terminal",
  "pavni-coral-circuit",
  "career-content-creator",
  "career-mechanical-engineer",
  "career-electrical-engineer",
  "career-finance-ca",
  "career-legal-professional",
  "career-architect-designer",
  "career-healthcare-professional",
  "career-ai-data",
  "career-product-designer",
  "career-business-consulting",
] as const satisfies readonly ActiveThemeLayoutKey[]);

export const PHOTO_FREE_THEME_LAYOUT_KEYS = Object.freeze([
  "pavni-professional-editorial",
  "pavni-modern-professional",
  "pavni-black-blue-startup",
  "pavni-illustrated-desk",
] as const satisfies readonly ActiveThemeLayoutKey[]);
