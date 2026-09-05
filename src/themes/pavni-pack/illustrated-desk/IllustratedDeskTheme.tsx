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

export default function IllustratedDeskTheme({ data, config }: PavniThemeProps) {
  const summarySlot = (
    <section className={styles.intro} id="summary">
      <div className={styles.doodle} aria-hidden="true">✦</div>
      <div><SectionTitle flavor="bento">About</SectionTitle><SectionContent data={data} flavor="bento" section="summary" /></div>
    </section>
  );
  const educationSlot = (
    <section className={styles.education} id="education">
      <div><SectionTitle flavor="bento">Learning corner</SectionTitle><SectionContent data={data} flavor="bento" section="education" /></div>
      <div className={styles.blocks} aria-hidden="true"><span>LEARN</span><span>MAKE</span><span>GROW</span><i /></div>
    </section>
  );

  return (
    <main
      className={`${foundation.root} ${styles.root}`}
      data-theme-layout="pavni-illustrated-desk"
      {...themeFrameProps(config, "pavni-illustrated-desk")}
    >
      <header className={styles.hero}>
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.cup} aria-hidden="true"><i /><span /></div>
        <div className={styles.laptop} aria-hidden="true"><div className={styles.screen}><span>&lt;/&gt;</span><i /><i /></div><div className={styles.keyboard}><b /><b /><b /><b /><b /><b /><b /><b /></div><div className={styles.trackpad} /></div>
        <div className={styles.heroCopy}><p>Portfolio workspace</p><h1>{data.personal.fullName || "Portfolio"}</h1><strong aria-hidden="true">Selected work</strong><span>{data.personal.headline}</span><ContactLine config={config} data={data} /></div>
        <p className={styles.hint}>Ideas, work<br />and learning ✦</p>
      </header>
      <div className={styles.content}>
        <OrderedSections
          config={config}
          data={data}
          flavor="bento"
          slots={{ education: educationSlot, summary: summarySlot }}
        />
      </div>
      <footer className={styles.footer}><span>A workspace for selected work.</span><span>{data.personal.fullName}</span></footer>
    </main>
  );
}
