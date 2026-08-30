import type { CSSProperties } from "react";
import { Gavel, Scale } from "lucide-react";

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
          <span className={styles.legalFolioMark} aria-hidden="true">
            <Gavel />
            Public portfolio record
          </span>
        </div>

        <div data-reveal style={revealStyle(0)}>
          <PortfolioHeader
            className={styles.legalHero}
            config={config}
            data={data}
            textAlign="center"
          />
        </div>

        <div className={styles.legalBody}>
          <aside className={styles.legalRail} aria-label="Brief index">
            <Scale aria-hidden="true" />
            <p className={styles.microLabel}>Brief index</p>
            <ol>
              {sections.map((sectionKey, index) => (
                <li key={sectionKey}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{SECTION_LABELS[sectionKey]}</span>
                </li>
              ))}
            </ol>
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
