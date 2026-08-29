"use client";

import type { PavniThemeProps } from "../types";
import { ContactLine, frameStyle, getThemeInitials, OrderedSections, SafeProfileImage, SectionContent } from "../shared";
import foundation from "../shared/foundation.module.css";
import styles from "./styles.module.css";

export default function NavyPitchTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const summarySlot = (
    <section className={styles.intro} id="summary">
      <div><p className={styles.index}>PROFILE / OPENING</p><h2>{data.personal.headline || fullName}</h2></div>
      <div className={styles.summary}><SectionContent data={data} flavor="bento" section="summary" /></div>
    </section>
  );

  return <main className={`${foundation.root} ${styles.root}`} data-animation={config.appearance.animationIntensity} data-color-mode={config.appearance.colorMode} data-theme-layout="pavni-navy-pitch" style={frameStyle(config)}>
    <header className={styles.cover}>
      <div className={styles.noise} aria-hidden="true" />
      <div className={styles.coverNav}><span>PRESENTATION / 15</span><span>SELECTED WORK</span><span>PORTFOLIO</span></div>
      <div className={styles.coverTitle}><p>PORTFOLIO</p><h1>{fullName}</h1></div>
      <strong aria-hidden="true" className={styles.nameTag}>{fullName}</strong>
      <div className={styles.imageStrip}><SafeProfileImage alt={`${fullName} portrait`} fallback={<span aria-label={`${fullName} initials`}>{getThemeInitials(fullName)}</span>} imageUrl={data.personal.profileImageUrl} showImage={config.visibility.showProfileImage} /></div>
      <div className={styles.coverFoot}><span>EDITION / 15</span><span>{data.personal.headline}</span><span>SCROLL TO ENTER</span></div>
    </header>
    <aside className={styles.contactBar} aria-label="Portfolio contact information"><ContactLine config={config} data={data} /></aside>
    <div className={styles.content}><OrderedSections config={config} data={data} flavor="bento" slots={{ summary: summarySlot }} /></div>
    <footer className={styles.footer}><span>NAVY PITCH / 15</span><span>SELECTED WORK / ARCHIVE</span></footer>
  </main>;
}
