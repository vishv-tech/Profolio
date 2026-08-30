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

export default function FinanceCaTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell
      className={`${styles.root} ${styles.finance}`}
      config={config}
      layoutKey="career-finance-ca"
    >
      <div className={styles.financeFrame}>
        <div className={styles.financeMasthead} data-reveal style={revealStyle(0)}>
          <span className={styles.microLabel}>Professional statement</span>
          <span className={styles.microLabel}>Prepared portfolio</span>
        </div>

        <PortfolioHeader
          className={styles.financeHero}
          config={config}
          data={data}
          imageClassName="rounded-[var(--career-radius)]"
        />

        <main className={styles.financeLedger}>
          {sections.map((sectionKey, index) => (
            <div data-reveal key={sectionKey} style={revealStyle(index + 1)}>
              <SectionRenderer
                className={styles.financeRow}
                data={data}
                sectionKey={sectionKey}
              />
            </div>
          ))}
        </main>
      </div>
    </ThemeShell>
  );
}
