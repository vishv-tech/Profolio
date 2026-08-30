import type { CSSProperties } from "react";
import { HeartPulse, Stethoscope } from "lucide-react";

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
          <div className={styles.clinicalPulse} aria-hidden="true">
            <HeartPulse />
          </div>
        </header>

        <div className={styles.clinicalEcg} aria-hidden="true">
          <span>CARE / PRACTICE / RECORD</span>
          <svg viewBox="0 0 720 72" preserveAspectRatio="none">
            <path
              className={styles.clinicalEcgLine}
              d="M0 38h174l20-18 22 43 28-56 26 31h150l18-14 18 28 24-45 25 31h215"
            />
          </svg>
        </div>

        <div className={styles.clinicalBody}>
          <aside className={styles.clinicalRail}>
            <Stethoscope aria-hidden="true" />
            <p className={styles.microLabel}>Professional record</p>
            <p>A focused view of experience, education, credentials, and selected work.</p>
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
