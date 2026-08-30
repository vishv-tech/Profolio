import type { CSSProperties } from "react";
import { DraftingCompass, Ruler } from "lucide-react";

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
        <div
          className={styles.architectHeroStage}
          data-reveal
          style={revealStyle(0)}
        >
          <PortfolioHeader
            className={styles.architectHero}
            config={config}
            data={data}
            imageClassName="rounded-none"
          />
          <div className={styles.architectDraft} aria-hidden="true">
            <DraftingCompass className={styles.architectCompass} />
            <Ruler className={styles.architectRuler} />
            <svg viewBox="0 0 280 180">
              <path className={styles.architectLine} d="M15 155V42h82V18h162v137Z" />
              <path className={styles.architectLine} d="M15 98h244M97 18v137M176 18v80" />
              <circle className={styles.architectPoint} cx="97" cy="98" r="5" />
              <circle className={styles.architectPoint} cx="176" cy="98" r="5" />
            </svg>
            <span className={styles.architectCallout}>A / 01</span>
          </div>
        </div>

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
