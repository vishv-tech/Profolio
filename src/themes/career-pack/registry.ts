import { aiDataManifest } from "./ai-data/manifest";
import { architectDesignerManifest } from "./architect-designer/manifest";
import { businessConsultingManifest } from "./business-consulting/manifest";
import { contentCreatorManifest } from "./content-creator/manifest";
import { electricalEngineerManifest } from "./electrical-engineer/manifest";
import { financeCaManifest } from "./finance-ca/manifest";
import { healthcareProfessionalManifest } from "./healthcare-professional/manifest";
import { legalProfessionalManifest } from "./legal-professional/manifest";
import { mechanicalEngineerManifest } from "./mechanical-engineer/manifest";
import { productDesignerManifest } from "./product-designer/manifest";
import type {
  CareerThemeManifest,
  ThemeComponent,
  ThemeManifest,
} from "./types";

export function createThemeRegistry(
  ...packs: ReadonlyArray<readonly ThemeManifest[]>
): ReadonlyMap<string, ThemeManifest> {
  const registry = new Map<string, ThemeManifest>();

  for (const pack of packs) {
    for (const manifest of pack) {
      if (registry.has(manifest.layoutKey)) {
        throw new Error(`Duplicate theme layout key: ${manifest.layoutKey}`);
      }

      registry.set(manifest.layoutKey, manifest);
    }
  }

  return registry;
}

export const careerThemePack: readonly CareerThemeManifest[] = Object.freeze([
  contentCreatorManifest,
  mechanicalEngineerManifest,
  electricalEngineerManifest,
  financeCaManifest,
  legalProfessionalManifest,
  architectDesignerManifest,
  healthcareProfessionalManifest,
  aiDataManifest,
  productDesignerManifest,
  businessConsultingManifest,
]);

export const careerThemeRegistry = createThemeRegistry(careerThemePack);

export function getCareerThemeManifest(
  layoutKey: string,
): CareerThemeManifest | null {
  return (careerThemeRegistry.get(layoutKey) as CareerThemeManifest | undefined) ?? null;
}

export async function loadCareerThemeComponent(
  layoutKey: string,
): Promise<ThemeComponent | null> {
  const manifest = getCareerThemeManifest(layoutKey);
  if (!manifest) {
    return null;
  }

  return (await manifest.component()).default;
}
