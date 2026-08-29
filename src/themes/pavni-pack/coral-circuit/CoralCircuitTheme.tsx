"use client";

import {
  ContactLine,
  frameStyle,
  getThemeInitials,
  OrderedSections,
  SafeProfileImage,
  SectionContent,
} from "../shared";
import foundation from "../shared/foundation.module.css";
import type { PavniThemeProps } from "../types";
import styles from "./styles.module.css";

export default function CoralCircuitTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const summarySlot = (
    <section className={styles.intro} id="summary">
      <div>
        <p className={styles.index}>PROFILE / SIGNAL</p>
        <h2>{data.personal.headline || fullName}</h2>
      </div>
      <div className={styles.summary}>
        <SectionContent data={data} flavor="bento" section="summary" />
      </div>
    </section>
  );

  return (
    <main
      className={`${foundation.root} ${styles.root}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout="pavni-coral-circuit"
      data-theme-pack="pavni"
      style={frameStyle(config)}
    >
      <header className={styles.cover}>
        <div aria-hidden="true" className={styles.circuit} />
        <div aria-hidden="true" className={styles.dot} />
        <div aria-hidden="true" className={styles.signalNodes}><i /><i /><i /></div>
        <div className={styles.coverNav}>
          <span>CIRCUIT / 25</span><span>SELECTED PRACTICE</span><span>PORTFOLIO</span>
        </div>
        <div className={styles.title}>
          <p>PORTFOLIO / SELECTED WORK</p>
          <h1>{fullName}</h1>
          {data.personal.headline.trim() ? <strong>{data.personal.headline}</strong> : null}
        </div>
        <div className={styles.photoTile}>
          <SafeProfileImage
            alt={`${fullName} portrait`}
            fallback={<span aria-label={`${fullName} initials`}>{getThemeInitials(fullName)}</span>}
            imageUrl={data.personal.profileImageUrl}
            showImage={config.visibility.showProfileImage}
          />
          <small>FIELD IMAGE / 25</small>
        </div>
        <p className={styles.note}>PROJECTS<br />EXPERIENCE<br />SKILLS</p>
      </header>
      <aside aria-label="Portfolio contact information" className={styles.contactBar}>
        <ContactLine config={config} data={data} />
      </aside>
      <div className={styles.content}>
        <OrderedSections
          config={config}
          data={data}
          flavor="bento"
          slots={{ summary: summarySlot }}
        />
      </div>
      <footer className={styles.footer}>
        <span>CORAL CIRCUIT / 25</span><span>WORK / SIGNAL / ARCHIVE</span>
      </footer>
    </main>
  );
}
