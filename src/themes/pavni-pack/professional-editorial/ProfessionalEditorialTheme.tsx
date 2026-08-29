"use client";

import {
  ContactLine,
  frameStyle,
  OrderedSections,
  SectionContent,
} from "../shared";
import foundation from "../shared/foundation.module.css";
import type { PavniThemeProps } from "../types";
import styles from "./styles.module.css";

export default function ProfessionalEditorialTheme({ data, config }: PavniThemeProps) {
  const summarySlot = (
    <section className={styles.intro} id="summary">
      <p className={styles.index}>01 / introduction</p>
      <SectionContent data={data} flavor="minimal" section="summary" />
      <p className={styles.role}>{data.personal.headline}</p>
    </section>
  );

  return (
    <main
      className={`${foundation.root} ${styles.root}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout="pavni-professional-editorial"
      style={frameStyle(config)}
    >
      <header className={styles.cover}>
        <nav aria-label="Portfolio navigation" className={styles.nav}>
          <span>01 / {data.personal.fullName}</span>
          <div>
            <a href="#portfolio-sections">Work</a>
            <a href="#contact">Contact</a>
          </div>
        </nav>
        <div className={styles.title}>
          <p>{data.personal.headline || "Professional portfolio"}</p>
          <h1>{data.personal.fullName || "Untitled portfolio"}</h1>
          <div>
            <span>Selected work and experience</span>
            <span aria-hidden="true">Scroll to explore ↓</span>
          </div>
        </div>
      </header>

      <div className={styles.contact} id="contact">
        <ContactLine config={config} data={data} />
      </div>
      <div className={styles.content} id="portfolio-sections">
        <OrderedSections
          config={config}
          data={data}
          flavor="minimal"
          slots={{ summary: summarySlot }}
        />
      </div>
      <footer>Portfolio / {data.personal.fullName}</footer>
    </main>
  );
}
