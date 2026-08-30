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

export default function HealthcareProfessionalTheme({
  data,
  config,
}: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell
      className={`${styles.root} ${styles.clinical}`}
      config={config}
      layoutKey="career-healthcare-professional"
    >
      <div className={styles.clinicalFrame}>
        <header className={styles.clinicalHeader} data-reveal style={revealStyle(0)}>
          <PortfolioHeader config={config} data={data} />
          <div className={styles.clinicalPulse} aria-hidden="true">+</div>
        </header>

        <div className={styles.clinicalBody}>
          <aside className={styles.clinicalRail}>
            <p className={styles.microLabel}>Professional record</p>
            <p>Clear experience, education, credentials, and selected work from the verified portfolio record.</p>
          </aside>

          <main className={styles.clinicalSections}>
            {sections.map((sectionKey, index) => (
              <div
                className={`${styles.sectionCard} ${styles.clinicalSection}`}
                data-reveal
                data-section={sectionKey}
                key={sectionKey}
                style={revealStyle(index + 1)}
              >
                <span className="sr-only">{SECTION_LABELS[sectionKey]}</span>
                <SectionRenderer data={data} sectionKey={sectionKey} />
              </div>
            ))}
          </main>
        </div>
      </div>
    </ThemeShell>
  );
}
