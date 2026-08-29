import {
  careerThemePack,
  createThemeRegistry,
  type ThemeComponent,
  type ThemeManifest,
} from "./career-pack";
import { pavniThemePack } from "./pavni-pack";

export const allThemePack: readonly ThemeManifest[] = Object.freeze([
  ...pavniThemePack,
  ...careerThemePack,
]);

export const allThemeRegistry = createThemeRegistry(
  pavniThemePack,
  careerThemePack,
);

export function getThemeManifest(layoutKey: string): ThemeManifest | null {
  return allThemeRegistry.get(layoutKey) ?? null;
}

export async function loadThemeComponent(
  layoutKey: string,
): Promise<ThemeComponent | null> {
  const manifest = getThemeManifest(layoutKey);
  return manifest ? (await manifest.component()).default : null;
}
