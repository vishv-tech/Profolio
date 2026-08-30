import type { CSSProperties } from "react";
import { Presentation, TrendingUp } from "lucide-react";

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
            <div className={styles.consultingMarkTopline}>
              <Presentation />
              <span>{String(sections.length + 1).padStart(2, "0")} slides</span>
            </div>
            <div className={styles.consultingGrowth}>
              <TrendingUp />
              <svg viewBox="0 0 220 90">
                <path className={styles.consultingGrowthLine} d="m4 80 46-34 38 18 48-46 32 18 48-32" />
                <path className={styles.consultingGrowthFill} d="m4 80 46-34 38 18 48-46 32 18 48-32v86H4Z" />
              </svg>
            </div>
            <strong>/01</strong>
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
