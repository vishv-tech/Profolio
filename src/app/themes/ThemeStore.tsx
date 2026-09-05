"use client";

import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  LayoutGrid,
  LoaderCircle,
  Palette,
  Rocket,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Component,
  createElement,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type LazyExoticComponent,
  type ReactNode,
} from "react";

import { publishPortfolio } from "@/lib/portfolios/actions";
import { isAiThemeEngineSupported } from "@/lib/theme-ai/capabilities";
import type { ThemeStoreEntry } from "@/lib/themes/store";
import { cn } from "@/lib/utils";
import { allThemePack, type ThemeComponent } from "@/themes";
import type { PortfolioData } from "@/types/portfolio";
import type { ThemeConfig } from "@/types/theme";

import { selectPortfolioTheme } from "./actions";
import styles from "./ThemeStore.module.css";
import { ThemeStudio } from "./ThemeStudio";

const lazyThemes: ReadonlyMap<
  string,
  LazyExoticComponent<ThemeComponent>
> = new Map(
  allThemePack.map((manifest) => [
    manifest.layoutKey,
    lazy(manifest.component),
  ]),
);

const CARD_PALETTES = [
  { background: "#dce6d7", ink: "#18372e", accent: "#bc6348", paper: "#fffaf0" },
  { background: "#f0dfce", ink: "#522d25", accent: "#b94f37", paper: "#fffaf2" },
  { background: "#233d35", ink: "#f5efe3", accent: "#d6876d", paper: "#d7e0cf" },
  { background: "#d8dde5", ink: "#1e3444", accent: "#335f7a", paper: "#f7f4eb" },
  { background: "#eee4c9", ink: "#3d3828", accent: "#77814b", paper: "#fffdf7" },
  { background: "#e7d8df", ink: "#492f3d", accent: "#a24f70", paper: "#fff8f3" },
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
        <div className={styles.previewState}>
          <CircleAlert aria-hidden="true" />
          <h3>Preview unavailable</h3>
          <p>Choose another theme while this preview is being checked.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

function PreviewLoading() {
  return (
    <div className={styles.previewState}>
      <LoaderCircle aria-hidden="true" className={styles.spinner} />
      <h3>Preparing your live preview</h3>
      <p>Your saved draft stays unchanged.</p>
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
      <div className={styles.previewState}>
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
  const palette = CARD_PALETTES[index % CARD_PALETTES.length];
  const previewImage =
    entry.previewImage ?? `/theme-previews/${entry.layoutKey}.png`;
  const paletteStyle = {
    "--art-accent": palette.accent,
    "--art-background": palette.background,
    "--art-ink": palette.ink,
    "--art-paper": palette.paper,
  } as CSSProperties;

  return (
    <div aria-hidden="true" className={styles.cardArtwork} style={paletteStyle}>
      <div className={styles.fallbackArtwork}>
        <div className={styles.fallbackNav}>
          <span>{entry.name.slice(0, 2).toUpperCase()}.</span>
          <span>Work&nbsp;&nbsp; About</span>
        </div>
        <div className={styles.fallbackHero}>
          <span className={styles.fallbackKicker}>{entry.category}</span>
          <strong>{entry.name}</strong>
          <span className={styles.fallbackCopy} />
          <span className={styles.fallbackCopyShort} />
        </div>
        <div className={styles.fallbackTiles}>
          <span />
          <span />
          <span />
        </div>
      </div>
      <div
        className={styles.previewImage}
        style={{ backgroundImage: `url(${JSON.stringify(previewImage)})` }}
      />
      <div className={styles.artworkShade} />
      <span className={styles.artworkCategory}>{entry.category}</span>
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [themeEngineOpen, setThemeEngineOpen] = useState(false);
  const themeEngineButtonRef = useRef<HTMLButtonElement>(null);
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    message: string;
  } | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isPublishing, startPublishing] = useTransition();

  useEffect(() => {
    if (!previewOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (themeEngineOpen) {
        setThemeEngineOpen(false);
        window.requestAnimationFrame(() => themeEngineButtonRef.current?.focus());
        return;
      }

      setPreviewOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [previewOpen, themeEngineOpen]);

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
  const selectedSupportsThemeEngine = selected
    ? isAiThemeEngineSupported(selected.layoutKey)
    : false;
  const selectedIndex = selected
    ? catalog.findIndex((entry) => entry.layoutKey === selected.layoutKey)
    : -1;

  function setPreviewTheme(nextLayoutKey: string, openPreview: boolean) {
    if (!catalog.some((entry) => entry.layoutKey === nextLayoutKey)) {
      return;
    }

    setLayoutKey(nextLayoutKey);
    setThemeEngineOpen(false);
    setFeedback(null);
    setPreviewOpen(openPreview);
    window.history.replaceState(
      null,
      "",
      `/themes?portfolio=${encodeURIComponent(portfolioId)}&theme=${encodeURIComponent(nextLayoutKey)}`,
    );
  }

  function closePreview() {
    setThemeEngineOpen(false);
    setPreviewOpen(false);
  }

  function closeThemeEngine() {
    setThemeEngineOpen(false);
    window.requestAnimationFrame(() => themeEngineButtonRef.current?.focus());
  }

  function movePreview(direction: -1 | 1) {
    if (selectedIndex < 0) return;

    const nextIndex =
      (selectedIndex + direction + catalog.length) % catalog.length;
    const nextTheme = catalog[nextIndex];

    if (nextTheme) setPreviewTheme(nextTheme.layoutKey, true);
  }

  function saveTheme(theme: ThemeStoreEntry = selected) {
    if (!theme?.canPersist) {
      setFeedback({
        tone: "error",
        message:
          "This theme needs an active database metadata row before it can be saved.",
      });
      return;
    }

    setLayoutKey(theme.layoutKey);
    if (theme.layoutKey !== layoutKey) setThemeEngineOpen(false);
    setFeedback(null);
    if (theme.layoutKey !== layoutKey) {
      window.history.replaceState(
        null,
        "",
        `/themes?portfolio=${encodeURIComponent(portfolioId)}&theme=${encodeURIComponent(theme.layoutKey)}`,
      );
    }
    startSaving(async () => {
      try {
        const result = await selectPortfolioTheme(
          portfolioId,
          theme.layoutKey,
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
          message: `${theme.name} is saved to this draft.`,
        });
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
          `/dashboard?portfolio=${encodeURIComponent(portfolioId)}&published=1`,
        );
      } catch {
        setFeedback({
          tone: "error",
          message: "The portfolio could not be published. Please try again.",
        });
      }
    });
  }

  function reconcileThemeStudioConfig(themeConfig: ThemeConfig) {
    setConfigOverrides((current) => ({
      ...current,
      [selected.layoutKey]: themeConfig,
    }));
  }

  if (!selected || !selectedConfig) {
    return null;
  }

  return (
    <main className={styles.store}>
      <div className={styles.storeInner}>
        <header className={styles.storeHero}>
          <div>
            <p className={styles.eyebrow}>
              <Palette aria-hidden="true" />
              Profolio Theme Store
            </p>
            <h1>Choose your portfolio personality.</h1>
            <p className={styles.intro}>
              Browse thoughtful layouts for <strong>{portfolioTitle}</strong>, then preview your real content before choosing.
            </p>
          </div>
          <div className={styles.catalogSummary}>
            <Sparkles aria-hidden="true" />
            <span>
              <strong>{catalog.length} themes</strong>
              {selectableCount} ready to use
            </span>
          </div>
        </header>

        {metadataReadFailed || selectableCount < catalog.length ? (
          <div className={styles.notice}>
            <CircleAlert aria-hidden="true" />
            <p>
              {metadataReadFailed
                ? "Theme metadata could not be loaded. You can still explore every preview, but saving is temporarily unavailable."
                : `${catalog.length - selectableCount} themes are available to preview while their store metadata is being prepared.`}
            </p>
          </div>
        ) : null}

        <section aria-label="Theme filters" className={styles.filters}>
          <label className={styles.searchBox}>
            <span className="sr-only">Search themes</span>
            <Search aria-hidden="true" />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search themes, careers, or styles"
              type="search"
              value={query}
            />
          </label>
          <div aria-label="Theme categories" className={styles.categories}>
            {categories.map((value) => (
              <button
                aria-pressed={category === value}
                className={cn(
                  styles.categoryChip,
                  category === value && styles.categoryChipActive,
                )}
                key={value}
                onClick={() => setCategory(value)}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
          <span className={styles.resultCount}>
            <LayoutGrid aria-hidden="true" />
            {filteredCatalog.length} results
          </span>
        </section>

        <div aria-live="polite">
          {feedback ? (
            <p
              className={cn(
                styles.feedback,
                feedback.tone === "success"
                  ? styles.feedbackSuccess
                  : styles.feedbackError,
              )}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>

        {filteredCatalog.length ? (
          <section aria-label="Portfolio themes" className={styles.themeGrid}>
            {filteredCatalog.map((entry) => {
              const catalogIndex = catalog.findIndex(
                (theme) => theme.layoutKey === entry.layoutKey,
              );
              const isSaved = entry.layoutKey === savedLayoutKey;

              return (
                <article className={styles.themeCard} key={entry.layoutKey}>
                  <button
                    aria-label={`Preview ${entry.name}`}
                    className={styles.artworkButton}
                    onClick={() => setPreviewTheme(entry.layoutKey, true)}
                    type="button"
                  >
                    <ThemeCardArtwork entry={entry} index={catalogIndex} />
                    <span className={styles.hoverPreview}>
                      <Eye aria-hidden="true" />
                      Preview theme
                    </span>
                  </button>
                  <div className={styles.cardBody}>
                    <div className={styles.cardTitleRow}>
                      <div>
                        <h2>{entry.name}</h2>
                        <p>{entry.description}</p>
                      </div>
                      {isSaved ? (
                        <span className={styles.savedBadge}>
                          <Check aria-hidden="true" />
                          Saved
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.tags}>
                      {entry.styleTags.slice(0, 3).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.previewButton}
                        onClick={() => setPreviewTheme(entry.layoutKey, true)}
                        type="button"
                      >
                        <Eye aria-hidden="true" />
                        Preview
                      </button>
                      <button
                        className={styles.useButton}
                        disabled={isSaving || !entry.canPersist}
                        onClick={() => saveTheme(entry)}
                        type="button"
                      >
                        {isSaving && entry.layoutKey === selected.layoutKey ? (
                          <LoaderCircle aria-hidden="true" className={styles.spinner} />
                        ) : (
                          <Check aria-hidden="true" />
                        )}
                        {isSaved ? "Theme selected" : "Use this theme"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className={styles.emptyState}>
            <Search aria-hidden="true" />
            <h2>No themes found</h2>
            <p>Try a broader search or choose another category.</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {previewOpen ? (
        <div
          aria-labelledby="theme-preview-title"
          aria-modal="true"
          className={styles.previewOverlay}
          role="dialog"
        >
          <button
            aria-label="Close theme preview"
            className={styles.overlayBackdrop}
            onClick={closePreview}
            type="button"
          />
          <section className={styles.previewDialog}>
            <header className={styles.previewHeader}>
              <div className={styles.previewIdentity}>
                <p>Live portfolio preview</p>
                <h2 id="theme-preview-title">{selected.name}</h2>
                <span>{selected.category} · Your saved portfolio content</span>
              </div>
              <div className={styles.previewActions}>
                <button
                  aria-label="Previous theme"
                  className={styles.iconButton}
                  onClick={() => movePreview(-1)}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button
                  aria-label="Next theme"
                  className={styles.iconButton}
                  onClick={() => movePreview(1)}
                  type="button"
                >
                  <ChevronRight aria-hidden="true" />
                </button>
                <button
                  aria-controls="ai-theme-engine-drawer"
                  aria-expanded={themeEngineOpen}
                  className={styles.engineButton}
                  disabled={!selectedSupportsThemeEngine || !selectedIsSaved}
                  onClick={() => setThemeEngineOpen(true)}
                  ref={themeEngineButtonRef}
                  title={
                    !selectedSupportsThemeEngine
                      ? "AI customization is currently available for selected themes."
                      : !selectedIsSaved
                        ? "Select this theme to customize it with AI."
                        : "Open AI Theme Engine"
                  }
                  type="button"
                >
                  <Sparkles aria-hidden="true" />
                  {selectedSupportsThemeEngine
                    ? "AI Theme Engine"
                    : "AI Theme Engine · Soon"}
                </button>
                <button
                  className={styles.modalUseButton}
                  disabled={isSaving || !selected.canPersist}
                  onClick={() => saveTheme(selected)}
                  type="button"
                >
                  {isSaving ? (
                    <LoaderCircle aria-hidden="true" className={styles.spinner} />
                  ) : (
                    <Check aria-hidden="true" />
                  )}
                  {selectedIsSaved ? "Theme selected" : "Use this theme"}
                </button>
                <button
                  className={styles.publishButton}
                  disabled={!selectedIsSaved || isPublishing}
                  onClick={publishSavedPortfolio}
                  type="button"
                >
                  {isPublishing ? (
                    <LoaderCircle aria-hidden="true" className={styles.spinner} />
                  ) : (
                    <Rocket aria-hidden="true" />
                  )}
                  Publish
                  <ArrowUpRight aria-hidden="true" />
                </button>
                <button
                  aria-label="Close theme preview"
                  className={styles.closeButton}
                  onClick={closePreview}
                  type="button"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            </header>

            {!selected.canPersist ? (
              <p className={styles.previewOnlyNotice}>
                Preview only — this layout is waiting for its active store metadata before it can be selected.
              </p>
            ) : null}

            <div aria-live="polite">
              {feedback ? (
                <p
                  className={cn(
                    styles.modalFeedback,
                    feedback.tone === "success"
                      ? styles.feedbackSuccess
                      : styles.feedbackError,
                  )}
                >
                  {feedback.message}
                </p>
              ) : null}
            </div>

            <div
              className={cn(
                styles.previewWorkspace,
                themeEngineOpen && styles.previewWorkspaceWithEngine,
              )}
            >
              {selectedIsSaved && selectedSupportsThemeEngine ? (
                <ThemeStudio
                  config={selectedConfig}
                  key={selected.layoutKey}
                  layoutKey={selected.layoutKey}
                  onClose={closeThemeEngine}
                  onConfigSaved={reconcileThemeStudioConfig}
                  open={themeEngineOpen}
                  portfolioId={portfolioId}
                />
              ) : null}
              <div className={styles.previewViewport}>
                <div className={styles.previewCanvas}>
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
            </div>
            <footer className={styles.previewFooter}>
              <span>{selectedIndex + 1} / {catalog.length}</span>
              <p>Previewing with {portfolioData.personal.fullName || "your portfolio"}&apos;s real saved content.</p>
              <button onClick={closePreview} type="button">Close preview</button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
