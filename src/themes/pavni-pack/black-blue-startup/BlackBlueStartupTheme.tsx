"use client";

import {
  ContactLine,
  OrderedSections,
  SectionContent,
  SectionTitle,
  themeFrameProps,
} from "../shared";
import foundation from "../shared/foundation.module.css";
import type { PavniThemeProps } from "../types";
import styles from "./styles.module.css";

export default function BlackBlueStartupTheme({ data, config }: PavniThemeProps) {
  const summarySlot = (
    <section className={styles.summary} id="summary">
      <SectionTitle flavor="modern">About</SectionTitle>
      <SectionContent data={data} flavor="modern" section="summary" />
    </section>
  );

  return (
    <main
      className={`${foundation.root} ${styles.root}`}
      data-theme-layout="pavni-black-blue-startup"
      {...themeFrameProps(config, "pavni-black-blue-startup")}
    >
      <header className={styles.hero}>
        <nav aria-label="Portfolio context" className={styles.nav}>
          <span className={styles.mark}>PF /</span><span>Portfolio system</span><span>Selected work</span>
        </nav>
        <div className={styles.orbit} aria-hidden="true"><i /><i /><i /></div>
        <div className={styles.heroCopy}>
          <p>Professional portfolio</p>
          <h1>{data.personal.fullName || "Untitled portfolio"}</h1>
          <div className={styles.heroMeta}><span>{data.personal.headline}</span></div>
        </div>
      </header>
      <section className={styles.contact} id="contact">
        <p>Contact &amp; links</p>
        <ContactLine config={config} data={data} />
      </section>
      <div className={styles.content}>
        <OrderedSections
          config={config}
          data={data}
          flavor="modern"
          slots={{ summary: summarySlot }}
        />
      </div>
      <footer className={styles.footer}><span>Selected work and experience.</span><span>{data.personal.fullName}</span></footer>
    </main>
  );
}
