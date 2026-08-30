import type { CSSProperties } from "react";
import { Cog, Nut, Wrench } from "lucide-react";

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

export default function MechanicalEngineerTheme({
  data,
  config,
}: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell
      className={`${styles.root} ${styles.mechanical}`}
      config={config}
      layoutKey="career-mechanical-engineer"
    >
      <div className={styles.mechanicalFrame}>
        <div className={styles.mechanicalTitleBar} data-reveal style={revealStyle(0)}>
          <span className={styles.microLabel}>Engineering portfolio / specification</span>
          <span className={styles.microLabel}>Sheet 01</span>
        </div>
        <div
          className={styles.mechanicalHeroStage}
          data-reveal
          style={revealStyle(1)}
        >
          <PortfolioHeader
            className={styles.mechanicalHero}
            config={config}
            data={data}
            imageClassName="rounded-none"
          />
          <div className={styles.mechanicalAssembly} aria-hidden="true">
            <span className={`${styles.mechanicalGear} ${styles.mechanicalGearLarge}`}>
              <Cog />
            </span>
            <span className={`${styles.mechanicalGear} ${styles.mechanicalGearSmall}`}>
              <Cog />
            </span>
            <span className={styles.mechanicalNut}>
              <Nut />
            </span>
            <span className={styles.mechanicalTool}>
              <Wrench />
            </span>
          </div>
        </div>

        <div className={styles.mechanicalBody}>
          <aside className={styles.mechanicalIndex} aria-label="Portfolio drawing index">
            <p className={styles.microLabel}>Drawing index</p>
            <ol>
              {sections.map((sectionKey, index) => (
                <li key={sectionKey}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{SECTION_LABELS[sectionKey]}</span>
                </li>
              ))}
            </ol>
          </aside>

          <main className={styles.mechanicalSections}>
            {sections.map((sectionKey, index) => (
              <div data-reveal key={sectionKey} style={revealStyle(index + 2)}>
                <SectionRenderer
                  className={`${styles.sectionCard} ${styles.mechanicalSection}`}
                  data={data}
                  sectionKey={sectionKey}
                />
              </div>
            ))}
          </main>
        </div>
      </div>
    </ThemeShell>
  );
}
