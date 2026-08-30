import type { CSSProperties } from "react";
import { Calculator, Sigma, TrendingUp } from "lucide-react";

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

        <section
          aria-label="Portfolio statement overview"
          className={styles.financeDashboard}
          data-reveal
          style={revealStyle(1)}
        >
          <div className={styles.financeMetric}>
            <Calculator aria-hidden="true" />
            <span>Visible chapters</span>
            <strong>{String(sections.length).padStart(2, "0")}</strong>
          </div>
          <div className={styles.financeChart} aria-hidden="true">
            <span style={{ "--bar-size": "42%" } as CSSProperties} />
            <span style={{ "--bar-size": "66%" } as CSSProperties} />
            <span style={{ "--bar-size": "54%" } as CSSProperties} />
            <span style={{ "--bar-size": "88%" } as CSSProperties} />
            <TrendingUp />
          </div>
          <div className={styles.financeFormula} aria-hidden="true">
            <Sigma />
            <div className={styles.financeFormulaTrack}>
              <span>01 / ANALYZE</span>
              <span>02 / RECONCILE</span>
              <span>03 / REPORT</span>
              <span>04 / ADVISE</span>
            </div>
          </div>
        </section>

        <main className={styles.financeLedger}>
          {sections.map((sectionKey, index) => (
            <div data-reveal key={sectionKey} style={revealStyle(index + 2)}>
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
