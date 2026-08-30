"use client";

import {
  ArrowUpRight,
  Check,
  CircleAlert,
  Eye,
  LoaderCircle,
  Palette,
  Rocket,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Component,
  createElement,
  lazy,
  Suspense,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
  type LazyExoticComponent,
  type ReactNode,
} from "react";

import { publishPortfolio } from "@/lib/portfolios/actions";
import type { ThemeStoreEntry } from "@/lib/themes/store";
import { cn } from "@/lib/utils";
import { allThemePack, type ThemeComponent } from "@/themes";
import type { PortfolioData } from "@/types/portfolio";
import type { ThemeConfig } from "@/types/theme";

import { selectPortfolioTheme } from "./actions";

const lazyThemes: ReadonlyMap<
  string,
  LazyExoticComponent<ThemeComponent>
> = new Map(
  allThemePack.map((manifest) => [
    manifest.layoutKey,
    lazy(manifest.component),
  ]),
);

const CARD_ACCENTS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#059669",
  "#0891b2",
] as const;

class PreviewBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // Renderer details intentionally stay out of the user-facing workspace.
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid min-h-80 place-items-center bg-muted/30 p-8 text-center">
          <div className="max-w-sm">
            <CircleAlert className="mx-auto size-7 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">Preview unavailable</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Choose another theme while this preview is being checked.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function PreviewLoading() {
  return (
    <div className="grid min-h-80 place-items-center bg-muted/30 p-8 text-center">
      <div>
        <LoaderCircle className="mx-auto size-7 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Preparing your live preview</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your saved draft stays unchanged.
        </p>
      </div>
    </div>
  );
}

function LiveThemePreview({
  config,
  data,
  layoutKey,
}: {
  config: ThemeConfig;
  data: PortfolioData;
  layoutKey: string;
}) {
  const Theme = lazyThemes.get(layoutKey);

  if (!Theme) {
    return (
      <div className="grid min-h-80 place-items-center p-8 text-sm text-muted-foreground">
        Choose a registered theme to preview.
      </div>
    );
  }

  return createElement(Theme, { config, data });
}

function ThemeCardArtwork({
  entry,
  index,
}: {
  entry: ThemeStoreEntry;
  index: number;
}) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const style: CSSProperties = entry.previewImage
    ? {
        backgroundImage: `linear-gradient(135deg, rgb(15 23 42 / 0.82), rgb(15 23 42 / 0.25)), url(${JSON.stringify(entry.previewImage)})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }
    : {
        background: `linear-gradient(135deg, ${accent}, #0f172a)`,
      };

  return (
    <div
      aria-hidden="true"
      className="relative flex aspect-[16/7] items-end overflow-hidden rounded-lg p-3 text-white"
      style={style}
    >
      <span className="absolute -right-4 -top-8 text-[7rem] font-black leading-none text-white/10">
        {entry.name.slice(0, 1)}
      </span>
      <span className="relative rounded-full border border-white/30 bg-black/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur">
        {entry.category}
      </span>
    </div>
  );
}

export function ThemeStore({
  catalog,
  initialLayoutKey,
  initialSavedLayoutKey,
  metadataReadFailed,
  portfolioData,
  portfolioId,
  portfolioTitle,
}: {
  catalog: ThemeStoreEntry[];
  initialLayoutKey: string;
  initialSavedLayoutKey: string | null;
  metadataReadFailed: boolean;
  portfolioData: PortfolioData;
  portfolioId: string;
  portfolioTitle: string;
}) {
  const router = useRouter();
  const [layoutKey, setLayoutKey] = useState(initialLayoutKey);
  const [savedLayoutKey, setSavedLayoutKey] = useState(
    initialSavedLayoutKey,
  );
  const [configOverrides, setConfigOverrides] = useState<
    Record<string, ThemeConfig>
  >({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    message: string;
  } | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isPublishing, startPublishing] = useTransition();

  const categories = useMemo(
    () => ["All", ...new Set(catalog.map((entry) => entry.category))],
    [catalog],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredCatalog = catalog.filter((entry) => {
    if (category !== "All" && entry.category !== category) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      entry.name,
      entry.description,
      ...entry.careerTags,
      ...entry.styleTags,
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });
  const selected =
    catalog.find((entry) => entry.layoutKey === layoutKey) ?? catalog[0];
  const selectedConfig = selected
    ? configOverrides[selected.layoutKey] ?? selected.config
    : null;
  const selectableCount = catalog.filter((entry) => entry.canPersist).length;
  const selectedIsSaved = selected?.layoutKey === savedLayoutKey;

  function previewTheme(nextLayoutKey: string) {
    if (!catalog.some((entry) => entry.layoutKey === nextLayoutKey)) {
      return;
    }

    setLayoutKey(nextLayoutKey);
    setFeedback(null);
    router.push(
      `/themes?portfolio=${encodeURIComponent(portfolioId)}&theme=${encodeURIComponent(nextLayoutKey)}`,
      { scroll: false },
    );
  }

  function saveTheme() {
    if (!selected?.canPersist) {
      setFeedback({
        tone: "error",
        message:
          "This theme needs an active database metadata row before it can be saved.",
      });
      return;
    }

    setFeedback(null);
    startSaving(async () => {
      try {
        const result = await selectPortfolioTheme(
          portfolioId,
          selected.layoutKey,
        );

        if (!result.success) {
          setFeedback({ tone: "error", message: result.message });
          return;
        }

        setConfigOverrides((current) => ({
          ...current,
          [result.layoutKey]: result.themeConfig,
        }));
        setSavedLayoutKey(result.layoutKey);
        setFeedback({
          tone: "success",
          message: `${selected.name} is saved to this draft.`,
        });
        router.refresh();
      } catch {
        setFeedback({
          tone: "error",
          message: "The theme choice could not be saved. Please try again.",
        });
      }
    });
  }

  function publishSavedPortfolio() {
    if (!selectedIsSaved) {
      return;
    }

    setFeedback(null);
    startPublishing(async () => {
      try {
        const result = await publishPortfolio(portfolioId);

        if (!result.success) {
          setFeedback({ tone: "error", message: result.message });
          return;
        }

        router.push(
          `/dashboard/deployments?portfolio=${encodeURIComponent(portfolioId)}&published=1`,
        );
      } catch {
        setFeedback({
          tone: "error",
          message: "The portfolio could not be published. Please try again.",
        });
      }
    });
  }

  if (!selected || !selectedConfig) {
    return null;
  }

  return (
    <main className="flex-1 bg-muted/30 px-3 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Palette aria-hidden="true" className="size-4" />
              Production Theme Store
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Choose a look for {portfolioTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Every preview below uses the saved draft for{" "}
              <strong className="font-medium text-foreground">
                {portfolioData.personal.fullName || "this portfolio"}
              </strong>
              . Changing themes changes presentation, not portfolio content.
            </p>
          </div>
          <div className="rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
            {catalog.length} coded themes · {selectableCount} ready to save
          </div>
        </div>

        {metadataReadFailed || selectableCount < catalog.length ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p className="leading-6">
              {metadataReadFailed
                ? "Theme database metadata could not be loaded. Previews remain available, but saving is temporarily disabled."
                : `${catalog.length - selectableCount} coded themes are preview-only until matching active theme metadata is added to the database. No fallback or mismatched theme ID will be saved.`}
            </p>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[23rem_minmax(0,1fr)]">
          <aside className="rounded-xl border bg-background p-3 shadow-sm sm:p-4">
            <div className="space-y-3">
              <label className="relative block">
                <span className="sr-only">Search themes</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, career, or style"
                  type="search"
                  value={query}
                />
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Theme categories">
                {categories.map((value) => (
                  <button
                    aria-pressed={category === value}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      category === value
                        ? "border-foreground bg-foreground text-background"
                        : "bg-background hover:bg-muted",
                    )}
                    key={value}
                    onClick={() => setCategory(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Showing {filteredCatalog.length} of {catalog.length}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:max-h-[calc(100svh-15rem)] xl:grid-cols-1 xl:overflow-y-auto xl:pr-1">
              {filteredCatalog.map((entry, index) => {
                const isSelected = entry.layoutKey === selected.layoutKey;
                const isSaved = entry.layoutKey === savedLayoutKey;

                return (
                  <article
                    className={cn(
                      "rounded-xl border p-2.5 transition",
                      isSelected
                        ? "border-foreground bg-muted/50 shadow-sm"
                        : "bg-background hover:border-foreground/30",
                    )}
                    key={entry.layoutKey}
                  >
                    <ThemeCardArtwork entry={entry} index={index} />
                    <div className="px-1 pb-1 pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="font-semibold leading-5">{entry.name}</h2>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {entry.description}
                          </p>
                        </div>
                        {isSaved ? (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                            <Check aria-hidden="true" className="size-3" />
                            Saved
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.styleTags.slice(0, 3).map((tag) => (
                          <span
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button
                        className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        onClick={() => previewTheme(entry.layoutKey)}
                        type="button"
                      >
                        <Eye aria-hidden="true" className="size-3.5" />
                        {isSelected ? "Previewing" : "Preview"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredCatalog.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No themes match these filters.
              </div>
            ) : null}
          </aside>

          <section className="min-w-0 overflow-hidden rounded-xl border bg-background shadow-sm">
            <header className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Live draft preview
                </p>
                <h2 className="mt-1 text-lg font-semibold">{selected.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selected.layoutKey}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
                  disabled={isSaving || !selected.canPersist}
                  onClick={saveTheme}
                  type="button"
                >
                  {isSaving ? (
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Check aria-hidden="true" className="size-4" />
                  )}
                  {selectedIsSaved ? "Theme saved" : "Use this theme"}
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                  disabled={!selectedIsSaved || isPublishing}
                  onClick={publishSavedPortfolio}
                  type="button"
                >
                  {isPublishing ? (
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Rocket aria-hidden="true" className="size-4" />
                  )}
                  Publish saved draft
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            </header>

            {!selected.canPersist ? (
              <p className="border-b bg-amber-50 px-4 py-2 text-xs leading-5 text-amber-950">
                Preview only: this coded layout has no unique active database
                theme record yet.
              </p>
            ) : null}

            <div aria-live="polite">
              {feedback ? (
                <p
                  className={cn(
                    "border-b px-4 py-2 text-sm",
                    feedback.tone === "success"
                      ? "bg-emerald-50 text-emerald-900"
                      : "bg-red-50 text-red-900",
                  )}
                >
                  {feedback.message}
                </p>
              ) : null}
            </div>

            <div className="overflow-x-auto bg-slate-100 p-1 sm:p-2">
              <div className="mx-auto min-w-0 overflow-hidden rounded-lg bg-white shadow-sm">
                <PreviewBoundary key={selected.layoutKey}>
                  <Suspense fallback={<PreviewLoading />}>
                    <LiveThemePreview
                      config={selectedConfig}
                      data={portfolioData}
                      layoutKey={selected.layoutKey}
                    />
                  </Suspense>
                </PreviewBoundary>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
