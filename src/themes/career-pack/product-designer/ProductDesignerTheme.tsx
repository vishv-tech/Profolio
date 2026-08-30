import type { CSSProperties } from "react";
import { MousePointer2, PanelsTopLeft } from "lucide-react";

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

export default function ProductDesignerTheme({
  data,
  config,
}: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell
      className={`${styles.root} ${styles.product}`}
      config={config}
      layoutKey="career-product-designer"
    >
      <div className={styles.productFrame}>
        <section className={styles.productHero} data-reveal style={revealStyle(0)}>
          <PortfolioHeader
            className={styles.productHeader}
            config={config}
            data={data}
            imageClassName="rounded-[var(--career-radius)]"
          />
          <div className={styles.productStatement} aria-hidden="true">
            <span className={styles.microLabel}>Product casebook</span>
            <strong>Work / process</strong>
            <div className={styles.productPrototype}>
              <PanelsTopLeft />
              <span className={styles.productPrototypePanel} />
              <span className={styles.productPrototypePanel} />
              <span className={styles.productPrototypeChip} />
              <MousePointer2 className={styles.productCursor} />
            </div>
          </div>
        </section>

        <main className={styles.productGrid}>
          {sections.map((sectionKey, index) => (
            <div
              className={`${styles.sectionCard} ${styles.productSection}`}
              data-reveal
              data-section={sectionKey}
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
