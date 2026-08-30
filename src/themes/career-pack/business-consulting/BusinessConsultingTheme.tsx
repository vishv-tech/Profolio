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

export default function BusinessConsultingTheme({
  data,
  config,
}: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell
      className={`${styles.root} ${styles.consulting}`}
      config={config}
      layoutKey="career-business-consulting"
    >
      <div className={styles.consultingFrame}>
        <section className={styles.consultingCover} data-reveal style={revealStyle(0)}>
          <PortfolioHeader
            className={styles.consultingHero}
            config={config}
            data={data}
            imageClassName="rounded-[var(--career-radius)]"
          />
          <div className={styles.consultingCoverMark} aria-hidden="true">
            /01
          </div>
        </section>

        <main className={styles.consultingDeck}>
          {sections.map((sectionKey, index) => (
            <section
              className={`${styles.sectionCard} ${styles.consultingSlide}`}
              data-reveal
              key={sectionKey}
              style={revealStyle(index + 1)}
            >
              <span className={styles.consultingSlideNumber}>
                {String(index + 2).padStart(2, "0")} / {SECTION_LABELS[sectionKey]}
              </span>
              <SectionRenderer data={data} sectionKey={sectionKey} />
            </section>
          ))}
        </main>
      </div>
    </ThemeShell>
  );
}
