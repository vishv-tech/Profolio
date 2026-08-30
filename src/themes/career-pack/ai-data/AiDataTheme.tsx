import type { CSSProperties } from "react";

import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SECTION_LABELS,
  SectionRenderer,
  ThemeShell,
} from "../shared";
import styles from "../shared/career-studio.module.css";

function revealStyle(index: number): CSSProperties {
  return { "--item-index": index } as CSSProperties;
}

export default function AiDataTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell
      className={`${styles.root} ${styles.ai}`}
      config={config}
      layoutKey="career-ai-data"
    >
      <div className={styles.aiFrame}>
        <div className={styles.terminalWindow}>
          <div className={styles.terminalBar}>
            <span>portfolio.run</span>
            <span>verified source data</span>
          </div>

          <PortfolioHeader
            className={styles.aiHero}
            config={config}
            data={data}
            imageClassName="rounded-[var(--career-radius)]"
          />

          <div className={styles.aiWorkspace}>
            <aside className={styles.aiRail} aria-label="Portfolio data index">
              <p className={styles.microLabel}>Dataset index</p>
              <ul>
                {sections.map((sectionKey, index) => (
                  <li key={sectionKey}>
                    {String(index + 1).padStart(2, "0")} / {SECTION_LABELS[sectionKey]}
                  </li>
                ))}
              </ul>
            </aside>

            <main className={styles.aiGrid}>
              {sections.map((sectionKey, index) => (
                <div
                  className={`${styles.sectionCard} ${styles.aiSection}`}
                  data-reveal
                  key={sectionKey}
                  style={revealStyle(index + 1)}
                >
                  <SectionRenderer data={data} sectionKey={sectionKey} />
                </div>
              ))}
            </main>
          </div>
        </div>
      </div>
    </ThemeShell>
  );
}
