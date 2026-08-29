"use client";

import type { PavniThemeProps } from "../types";
import { ContactLine, frameStyle, getThemeInitials, OrderedSections, SafeProfileImage, SectionContent } from "../shared";
import foundation from "../shared/foundation.module.css";
import styles from "./styles.module.css";

export default function NoirCreatorTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const summarySlot = <section className={styles.intro} id="summary"><div><p className={styles.index}>PROFILE / OPENING</p><h2>{data.personal.headline || fullName}</h2></div><div className={styles.summary}><SectionContent data={data} flavor="bento" section="summary" /></div></section>;
  return <main className={`${foundation.root} ${styles.root}`} data-animation={config.appearance.animationIntensity} data-color-mode={config.appearance.colorMode} data-theme-layout="pavni-noir-creator" style={frameStyle(config)}>
    <header className={styles.cover}><div className={styles.grain} aria-hidden="true" /><div className={styles.lineArt} aria-hidden="true" /><div className={styles.orbitLine} aria-hidden="true" />
      <div className={styles.coverNav}><span>NOIR / 18</span><span>SELECTED WORK</span><span>PORTFOLIO</span></div>
      <div className={styles.title}><h1>{fullName}</h1><p>Portfolio archive</p><strong aria-hidden="true">NOIR / 18</strong>{data.personal.headline.trim() ? <span>{data.personal.headline}</span> : null}</div>
      <div className={styles.portrait}><SafeProfileImage alt={`${fullName} portrait`} fallback={<span aria-label={`${fullName} initials`}>{getThemeInitials(fullName)}</span>} imageUrl={data.personal.profileImageUrl} showImage={config.visibility.showProfileImage} /></div>
      <p className={styles.coverNote}>PROJECT INDEX<br />SELECTED DETAILS</p>
    </header>
    <aside className={styles.contactBar} aria-label="Portfolio contact information"><ContactLine config={config} data={data} /></aside>
    <div className={styles.content}><OrderedSections config={config} data={data} flavor="bento" slots={{ summary: summarySlot }} /></div>
    <footer className={styles.footer}><span>NOIR CREATOR / 18</span><span>PROFILE / WORK / ARCHIVE</span></footer>
  </main>;
}
