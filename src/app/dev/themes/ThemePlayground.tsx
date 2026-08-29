"use client";

import {
  createElement,
  lazy,
  Suspense,
  useState,
  type LazyExoticComponent,
} from "react";

import { allThemePack } from "@/themes";
import { careerThemePack, type ThemeComponent } from "@/themes/career-pack";
import {
  careerThemeFixtureConfig,
  fullPortfolioFixture,
  sparsePortfolioFixture,
} from "@/themes/career-pack/dev/fixtures";
import { pavniThemePack } from "@/themes/pavni-pack";

type FixtureKey = "full" | "sparse";

const pavniKeys = new Set<string>(pavniThemePack.map((theme) => theme.layoutKey));
const lazyThemes: ReadonlyMap<string, LazyExoticComponent<ThemeComponent>> = new Map(
  allThemePack.map((manifest) => [
    manifest.layoutKey,
    lazy(manifest.component),
  ]),
);

function ThemePreview({
  fixture,
  layoutKey,
}: {
  fixture: FixtureKey;
  layoutKey: string;
}) {
  const Theme = lazyThemes.get(layoutKey);
  const data = fixture === "full" ? fullPortfolioFixture : sparsePortfolioFixture;

  return Theme ? createElement(Theme, {
    config: careerThemeFixtureConfig,
    data,
  }) : (
    <p className="p-8">The selected theme could not be loaded.</p>
  );
}

export function ThemePlayground() {
  const [layoutKey, setLayoutKey] = useState(allThemePack[0]?.layoutKey ?? "");
  const [fixture, setFixture] = useState<FixtureKey>("full");
  const selected = allThemePack.find((theme) => theme.layoutKey === layoutKey);
  const selectedPack = selected
    ? pavniKeys.has(selected.layoutKey)
      ? "Pavni pack"
      : "Career pack"
    : "Unknown pack";

  return (
    <main className="min-h-screen bg-slate-200 text-slate-950">
      <div className="sticky top-0 z-50 border-b border-slate-300 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-4">
          <div className="mr-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Development only
            </p>
            <h1 className="text-lg font-semibold">Unified theme playground</h1>
            {selected ? (
              <p className="mt-1 text-xs text-slate-600">
                {selectedPack} · {selected.category} · {selected.layoutKey}
              </p>
            ) : null}
          </div>

          <label className="grid gap-1 text-sm font-medium">
            Theme
            <select
              className="min-w-72 rounded-md border border-slate-300 bg-white px-3 py-2"
              onChange={(event) => setLayoutKey(event.target.value)}
              value={layoutKey}
            >
              <optgroup label={`Pavni pack (${pavniThemePack.length})`}>
                {pavniThemePack.map((theme) => (
                  <option key={theme.layoutKey} value={theme.layoutKey}>
                    {theme.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label={`Career pack (${careerThemePack.length})`}>
                {careerThemePack.map((theme) => (
                  <option key={theme.layoutKey} value={theme.layoutKey}>
                    {theme.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Fixture
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
              onChange={(event) => setFixture(event.target.value as FixtureKey)}
              value={fixture}
            >
              <option value="full">Full data</option>
              <option value="sparse">Sparse data</option>
            </select>
          </label>
        </div>
      </div>

      <div className="p-2 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl">
          <Suspense fallback={<p className="p-8">Loading theme…</p>}>
            <ThemePreview fixture={fixture} key={layoutKey} layoutKey={layoutKey} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
