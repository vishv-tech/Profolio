"use client";

import type { PavniThemeProps } from "../types";
import { ContactLine, frameStyle, getThemeInitials, OrderedSections, SafeProfileImage, SectionContent } from "../shared";
import foundation from "../shared/foundation.module.css";
import styles from "./styles.module.css";

export default function SoftFocusStudioTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const summarySlot = <section className={styles.intro} id="summary"><div><p className={styles.index}>PROFILE / STUDIO NOTE</p><h2>{data.personal.headline || fullName}</h2></div><div className={styles.summary}><SectionContent data={data} flavor="bento" section="summary" /></div></section>;
  return <main className={`${foundation.root} ${styles.root}`} data-animation={config.appearance.animationIntensity} data-color-mode={config.appearance.colorMode} data-theme-layout="pavni-soft-focus-studio" style={frameStyle(config)}>
    <header className={styles.cover}><div className={styles.paperGrain} aria-hidden="true" /><div className={styles.ring} aria-hidden="true" /><div className={`${styles.blob} ${styles.blobOne}`} aria-hidden="true" /><div className={`${styles.blob} ${styles.blobTwo}`} aria-hidden="true" />
      <div className={styles.coverNav}><span>STUDIO / 19</span><span>VISUAL ARCHIVE</span><span>PORTFOLIO</span></div>
      <div className={styles.title}><p>Soft focus / edition</p><h1>{fullName}</h1>{data.personal.headline.trim() ? <strong>{data.personal.headline}</strong> : null}</div>
      <div className={styles.imageStage}><SafeProfileImage alt={`${fullName} portrait`} fallback={<span aria-label={`${fullName} initials`}>{getThemeInitials(fullName)}</span>} imageUrl={data.personal.profileImageUrl} showImage={config.visibility.showProfileImage} /></div>
      <p className={styles.coverNote}>PROFILE<br />SELECTED WORK</p><span className={styles.scrollCue}>SCROLL TO EXPLORE</span>
    </header>
    <aside className={styles.contactBar} aria-label="Portfolio contact information"><ContactLine config={config} data={data} /></aside>
    <div className={styles.content}><OrderedSections config={config} data={data} flavor="bento" slots={{ summary: summarySlot }} /></div>
    <footer className={styles.footer}><span>SOFT FOCUS STUDIO / 19</span><span>WORK / NOTES / ARCHIVE</span></footer>
  </main>;
}
