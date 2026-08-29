import { blackBlueStartupManifest } from "./black-blue-startup/manifest";
import { blueBeigeFoldersManifest } from "./blue-beige-folders/manifest";
import { blueRedScriptManifest } from "./blue-red-script/manifest";
import { brownRedScrapbookManifest } from "./brown-red-scrapbook/manifest";
import { colorCutoutManifest } from "./color-cutout/manifest";
import { coralCircuitManifest } from "./coral-circuit/manifest";
import { creativeDeveloperManifest } from "./creative-developer/manifest";
import { dynamicBentoManifest } from "./dynamic-bento/manifest";
import { fuchsiaArchiveManifest } from "./fuchsia-archive/manifest";
import { geoSignalManifest } from "./geo-signal/manifest";
import { illustratedDeskManifest } from "./illustrated-desk/manifest";
import { kineticGalleryManifest } from "./kinetic-gallery/manifest";
import { limeLedgerManifest } from "./lime-ledger/manifest";
import { midnightSunManifest } from "./midnight-sun/manifest";
import { modernProfessionalManifest } from "./modern-professional/manifest";
import { monoEchoManifest } from "./mono-echo/manifest";
import { navyPitchManifest } from "./navy-pitch/manifest";
import { noirCreatorManifest } from "./noir-creator/manifest";
import { orbitSketchManifest } from "./orbit-sketch/manifest";
import { professionalEditorialManifest } from "./professional-editorial/manifest";
import { retroDesktopManifest } from "./retro-desktop/manifest";
import { sageTerminalManifest } from "./sage-terminal/manifest";
import { softFocusStudioManifest } from "./soft-focus-studio/manifest";
import { stripedNotesManifest } from "./striped-notes/manifest";
import { webverseCollageManifest } from "./webverse-collage/manifest";
import { createThemeRegistry } from "../career-pack/registry";
import type { ThemeComponent } from "../career-pack/types";
import type { PavniThemeManifest } from "./types";

export const pavniThemePack: readonly PavniThemeManifest[] = Object.freeze([
  professionalEditorialManifest,
  modernProfessionalManifest,
  dynamicBentoManifest,
  creativeDeveloperManifest,
  brownRedScrapbookManifest,
  blackBlueStartupManifest,
  webverseCollageManifest,
  illustratedDeskManifest,
  retroDesktopManifest,
  kineticGalleryManifest,
  blueBeigeFoldersManifest,
  stripedNotesManifest,
  colorCutoutManifest,
  monoEchoManifest,
  navyPitchManifest,
  orbitSketchManifest,
  geoSignalManifest,
  noirCreatorManifest,
  softFocusStudioManifest,
  blueRedScriptManifest,
  limeLedgerManifest,
  midnightSunManifest,
  fuchsiaArchiveManifest,
  sageTerminalManifest,
  coralCircuitManifest,
]);

export const pavniThemeRegistry = createThemeRegistry(pavniThemePack);

export function getPavniThemeManifest(
  layoutKey: string,
): PavniThemeManifest | null {
  return (
    (pavniThemeRegistry.get(layoutKey) as PavniThemeManifest | undefined) ?? null
  );
}

export async function loadPavniThemeComponent(
  layoutKey: string,
): Promise<ThemeComponent | null> {
  const manifest = getPavniThemeManifest(layoutKey);
  return manifest ? (await manifest.component()).default : null;
}
