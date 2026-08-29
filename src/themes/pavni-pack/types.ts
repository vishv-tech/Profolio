import type {
  ThemeComponentProps,
  ThemeManifest,
} from "@/themes/career-pack/types";

export type PavniThemeLayoutKey =
  | "pavni-professional-editorial"
  | "pavni-modern-professional"
  | "pavni-dynamic-bento"
  | "pavni-creative-developer"
  | "pavni-brown-red-scrapbook"
  | "pavni-black-blue-startup"
  | "pavni-webverse-collage"
  | "pavni-illustrated-desk"
  | "pavni-retro-desktop"
  | "pavni-kinetic-gallery"
  | "pavni-blue-beige-folders"
  | "pavni-striped-notes"
  | "pavni-color-cutout"
  | "pavni-mono-echo"
  | "pavni-navy-pitch"
  | "pavni-orbit-sketch"
  | "pavni-geo-signal"
  | "pavni-noir-creator"
  | "pavni-soft-focus-studio"
  | "pavni-blue-red-script"
  | "pavni-lime-ledger"
  | "pavni-midnight-sun"
  | "pavni-fuchsia-archive"
  | "pavni-sage-terminal"
  | "pavni-coral-circuit";

export type PavniThemeManifest = ThemeManifest<PavniThemeLayoutKey>;
export type PavniThemeProps = ThemeComponentProps;

export function definePavniTheme(
  manifest: PavniThemeManifest,
): PavniThemeManifest {
  return Object.freeze({
    ...manifest,
    careerTags: Object.freeze([...manifest.careerTags]),
    styleTags: Object.freeze([...manifest.styleTags]),
  });
}
