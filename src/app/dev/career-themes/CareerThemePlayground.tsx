"use client";

import { lazy, Suspense, useState } from "react";

import { careerThemePack } from "@/themes/career-pack";
import type { CareerThemeLayoutKey } from "@/themes/career-pack";
import {
  careerThemeFixtureConfig,
  fullPortfolioFixture,
  sparsePortfolioFixture,
} from "@/themes/career-pack/dev/fixtures";
import type { PortfolioData } from "@/types/portfolio";

type FixtureKey = "full" | "sparse";

const ContentCreatorTheme = lazy(
  () => import("@/themes/career-pack/content-creator/ContentCreatorTheme"),
);
const MechanicalEngineerTheme = lazy(
  () => import("@/themes/career-pack/mechanical-engineer/MechanicalEngineerTheme"),
);
const ElectricalEngineerTheme = lazy(
  () => import("@/themes/career-pack/electrical-engineer/ElectricalEngineerTheme"),
);
const FinanceCaTheme = lazy(
  () => import("@/themes/career-pack/finance-ca/FinanceCaTheme"),
);
const LegalProfessionalTheme = lazy(
  () => import("@/themes/career-pack/legal-professional/LegalProfessionalTheme"),
);
const ArchitectDesignerTheme = lazy(
  () => import("@/themes/career-pack/architect-designer/ArchitectDesignerTheme"),
);
const HealthcareProfessionalTheme = lazy(
  () => import("@/themes/career-pack/healthcare-professional/HealthcareProfessionalTheme"),
);
const AiDataTheme = lazy(
  () => import("@/themes/career-pack/ai-data/AiDataTheme"),
);
const ProductDesignerTheme = lazy(
  () => import("@/themes/career-pack/product-designer/ProductDesignerTheme"),
);
const BusinessConsultingTheme = lazy(
  () => import("@/themes/career-pack/business-consulting/BusinessConsultingTheme"),
);

interface CareerThemePreviewProps {
  data: PortfolioData;
  layoutKey: CareerThemeLayoutKey;
}

function CareerThemePreview({ data, layoutKey }: CareerThemePreviewProps) {
  const props = { config: careerThemeFixtureConfig, data };

  switch (layoutKey) {
    case "career-content-creator":
      return <ContentCreatorTheme {...props} />;
    case "career-mechanical-engineer":
      return <MechanicalEngineerTheme {...props} />;
    case "career-electrical-engineer":
      return <ElectricalEngineerTheme {...props} />;
    case "career-finance-ca":
      return <FinanceCaTheme {...props} />;
    case "career-legal-professional":
      return <LegalProfessionalTheme {...props} />;
    case "career-architect-designer":
      return <ArchitectDesignerTheme {...props} />;
    case "career-healthcare-professional":
      return <HealthcareProfessionalTheme {...props} />;
    case "career-ai-data":
      return <AiDataTheme {...props} />;
    case "career-product-designer":
      return <ProductDesignerTheme {...props} />;
    case "career-business-consulting":
      return <BusinessConsultingTheme {...props} />;
  }
}

export function CareerThemePlayground() {
  const [layoutKey, setLayoutKey] = useState<CareerThemeLayoutKey>(
    careerThemePack[0].layoutKey,
  );
  const [fixtureKey, setFixtureKey] = useState<FixtureKey>("full");
  const data = fixtureKey === "full" ? fullPortfolioFixture : sparsePortfolioFixture;

  return (
    <main className="min-h-screen bg-slate-200 text-slate-950">
      <div className="sticky top-0 z-10 border-b border-slate-300 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-4">
          <div className="mr-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Development only
            </p>
            <h1 className="text-lg font-semibold">Career theme playground</h1>
          </div>

          <label className="grid gap-1 text-sm font-medium">
            Theme
            <select
              className="min-w-56 rounded-md border border-slate-300 bg-white px-3 py-2"
              onChange={(event) =>
                setLayoutKey(event.target.value as CareerThemeLayoutKey)
              }
              value={layoutKey}
            >
              {careerThemePack.map((theme) => (
                <option key={theme.layoutKey} value={theme.layoutKey}>
                  {theme.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Fixture
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
              onChange={(event) => setFixtureKey(event.target.value as FixtureKey)}
              value={fixtureKey}
            >
              <option value="full">Full data</option>
              <option value="sparse">Sparse data</option>
            </select>
          </label>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl">
          <Suspense fallback={<p className="p-8">Loading theme…</p>}>
            <CareerThemePreview data={data} layoutKey={layoutKey} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
