"use client";

import type { PavniThemeProps } from "../types";
import { ContactLine, frameStyle, getThemeInitials, OrderedSections, SafeProfileImage, SectionContent } from "../shared";
import foundation from "../shared/foundation.module.css";
import styles from "./styles.module.css";

export default function GeoSignalTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const summarySlot = <section className={styles.intro} id="summary"><div><p className={styles.index}>PROFILE / SIGNAL</p><h2>{data.personal.headline || fullName}</h2></div><div className={styles.summary}><SectionContent data={data} flavor="bento" section="summary" /></div></section>;
  return <main className={`${foundation.root} ${styles.root}`} data-animation={config.appearance.animationIntensity} data-color-mode={config.appearance.colorMode} data-theme-layout="pavni-geo-signal" style={frameStyle(config)}>
    <header className={styles.cover}><div className={styles.grid} aria-hidden="true" /><div className={`${styles.dotField} ${styles.dotLeft}`} aria-hidden="true" /><div className={`${styles.dotField} ${styles.dotRight}`} aria-hidden="true" /><div className={styles.yellowDisk} aria-hidden="true" /><div className={styles.spark} aria-hidden="true">✦</div>
      <div className={styles.coverNav}><span>GEO / 17</span><span>SELECTED WORK</span><span>PORTFOLIO</span></div>
      <div className={styles.title}><p>PROJECT INDEX</p><h1>{fullName}</h1><strong aria-hidden="true">GEO / SIGNAL</strong></div>
      <div className={styles.photoPanel}><SafeProfileImage alt={`${fullName} portrait`} fallback={<span aria-label={`${fullName} initials`}>{getThemeInitials(fullName)}</span>} imageUrl={data.personal.profileImageUrl} showImage={config.visibility.showProfileImage} /></div>
      <p className={styles.coverNote}>PROJECTS<br />EXPERIENCE<br />DETAILS</p>
    </header>
    <aside className={styles.contactBar} aria-label="Portfolio contact information"><ContactLine config={config} data={data} /></aside>
    <div className={styles.content}><OrderedSections config={config} data={data} flavor="bento" slots={{ summary: summarySlot }} /></div>
    <footer className={styles.footer}><span>GEO SIGNAL / 17</span><span>SELECTED WORK / ARCHIVE</span></footer>
  </main>;
}
