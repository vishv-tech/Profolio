import type { CSSProperties } from "react";
import { Binary, Network } from "lucide-react";

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

          <div className={styles.aiHeroStage} data-reveal style={revealStyle(0)}>
            <PortfolioHeader
              className={styles.aiHero}
              config={config}
              data={data}
              imageClassName="rounded-[var(--career-radius)]"
            />
            <div className={styles.aiNetwork} aria-hidden="true">
              <Network />
              <svg viewBox="0 0 320 190">
                <g className={styles.aiConnections}>
                  <path d="M30 95 98 36l74 38 58-48 58 70-66 64-92-20-66 28Z" />
                  <path d="m98 36 32 104 42-66 50 86 8-134M30 95l142-21 116 22" />
                </g>
                <g className={styles.aiNodes}>
                  <circle cx="30" cy="95" r="6" />
                  <circle cx="98" cy="36" r="6" />
                  <circle cx="172" cy="74" r="7" />
                  <circle cx="230" cy="26" r="5" />
                  <circle cx="288" cy="96" r="7" />
                  <circle cx="222" cy="160" r="6" />
                  <circle cx="130" cy="140" r="5" />
                  <circle cx="64" cy="168" r="6" />
                </g>
              </svg>
            </div>
          </div>

          <div className={styles.aiDataStream} aria-hidden="true">
            <Binary />
            <div className={styles.aiDataTrack}>
              <span>01001 / VECTOR</span>
              <span>10110 / MODEL</span>
              <span>00101 / SIGNAL</span>
              <span>11010 / INSIGHT</span>
            </div>
          </div>

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
