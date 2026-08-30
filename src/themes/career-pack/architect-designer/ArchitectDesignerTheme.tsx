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

export default function ArchitectDesignerTheme({
  data,
  config,
}: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell
      className={`${styles.root} ${styles.architect}`}
      config={config}
      layoutKey="career-architect-designer"
    >
      <div className={styles.architectFrame}>
        <div className={styles.architectTopline}>
          <span className={styles.microLabel}>Spatial practice / selected work</span>
          <span className={styles.microLabel}>Studio folio</span>
        </div>
        <PortfolioHeader
          className={styles.architectHero}
          config={config}
          data={data}
          imageClassName="rounded-none"
        />

        <main className={styles.architectPlan}>
          {sections.map((sectionKey, index) => (
            <div
              className={`${styles.sectionCard} ${styles.architectSection}`}
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
