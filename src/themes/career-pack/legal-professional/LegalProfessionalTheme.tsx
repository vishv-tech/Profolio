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

export default function LegalProfessionalTheme({
  data,
  config,
}: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell
      className={`${styles.root} ${styles.legal}`}
      config={config}
      layoutKey="career-legal-professional"
    >
      <article className={styles.legalDocument}>
        <div className={styles.legalFolio}>
          <span className={styles.microLabel}>Professional brief</span>
          <span className={styles.microLabel}>Public portfolio record</span>
        </div>

        <PortfolioHeader
          className={styles.legalHero}
          config={config}
          data={data}
          textAlign="center"
        />

        <div className={styles.legalBody}>
          <aside className={styles.legalRail} aria-hidden="true">
            §
            <small>Experience · credentials · selected matters</small>
          </aside>
          <main className={styles.legalSections}>
            {sections.map((sectionKey, index) => (
              <div data-reveal key={sectionKey} style={revealStyle(index + 1)}>
                <SectionRenderer
                  className={styles.legalSection}
                  data={data}
                  sectionKey={sectionKey}
                />
              </div>
            ))}
          </main>
        </div>
      </article>
    </ThemeShell>
  );
}
