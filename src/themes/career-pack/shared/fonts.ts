import type { ThemeFont } from "@/types/theme";

export const THEME_FONT_STACKS: Readonly<Record<ThemeFont, string>> = {
  Geist: "var(--font-geist-sans), Arial, sans-serif",
  Inter: "Inter, Arial, sans-serif",
  Roboto: "Roboto, Arial, sans-serif",
  Poppins: "Poppins, Arial, sans-serif",
  Montserrat: "Montserrat, Arial, sans-serif",
  "Playfair Display": "\"Playfair Display\", Georgia, serif",
  "Source Sans 3": "\"Source Sans 3\", Arial, sans-serif",
  "JetBrains Mono": "\"JetBrains Mono\", Consolas, monospace",
};

export function getThemeFontStack(font: ThemeFont): string {
  return THEME_FONT_STACKS[font];
}
