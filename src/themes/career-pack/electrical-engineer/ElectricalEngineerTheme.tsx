import type { CSSProperties } from "react";

import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";
import styles from "../shared/career-studio.module.css";

function revealStyle(index: number): CSSProperties {
  return { "--item-index": index } as CSSProperties;
}

export default function ElectricalEngineerTheme({
  data,
  config,
}: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell
      className={`${styles.root} ${styles.electrical}`}
      config={config}
      layoutKey="career-electrical-engineer"
    >
      <div className={styles.electricalFrame}>
        <div className={styles.signalBar} data-reveal style={revealStyle(0)}>
          <span>Signal portfolio / online</span>
          <span className={styles.signalDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>

        <PortfolioHeader
          className={styles.electricalHero}
          config={config}
          data={data}
          imageClassName="rounded-[var(--career-radius)]"
        />

        <main className={styles.electricalGrid}>
          {sections.map((sectionKey, index) => (
            <div
              className={`${styles.sectionCard} ${styles.electricalSection}`}
              data-reveal
              key={sectionKey}
              style={revealStyle(index + 1)}
            >
              <SectionRenderer data={data} sectionKey={sectionKey} />
            </div>
          ))}
        </main>
      </div>
    </ThemeShell>
  );
}
