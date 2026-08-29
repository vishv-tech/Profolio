"use client";

import type { PavniThemeProps } from "../types";
import { ContactLine, frameStyle, getThemeInitials, OrderedSections, SafeProfileImage, SectionContent } from "../shared";
import foundation from "../shared/foundation.module.css";
import styles from "./styles.module.css";

export default function OrbitSketchTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const summarySlot = <section className={styles.intro} id="summary"><div><p className={styles.index}>PROFILE / WELCOME</p><h2>{data.personal.headline || fullName}</h2></div><div className={styles.summary}><SectionContent data={data} flavor="bento" section="summary" /></div></section>;

  return <main className={`${foundation.root} ${styles.root}`} data-animation={config.appearance.animationIntensity} data-color-mode={config.appearance.colorMode} data-theme-layout="pavni-orbit-sketch" style={frameStyle(config)}>
    <header className={styles.cover}>
      <div className={styles.paperGrid} aria-hidden="true" />
      <div className={`${styles.star} ${styles.starOne}`} aria-hidden="true">✦</div><div className={`${styles.star} ${styles.starTwo}`} aria-hidden="true">✧</div><div className={`${styles.star} ${styles.starThree}`} aria-hidden="true">✦</div>
      <div className={styles.coverNav}><span>ORBIT / 16</span><span>ILLUSTRATED ARCHIVE</span><span>PORTFOLIO</span></div>
      <div className={styles.album}><i className={styles.albumSpine} aria-hidden="true" /><div className={styles.albumSticker} aria-hidden="true">✷</div><div className={styles.albumPages} aria-hidden="true"><i /><i /><i /></div><div className={styles.albumPhoto}><SafeProfileImage alt={`${fullName} portrait`} fallback={<span aria-label={`${fullName} initials`}>{getThemeInitials(fullName)}</span>} imageUrl={data.personal.profileImageUrl} showImage={config.visibility.showProfileImage} /></div><small>PERSONAL ARCHIVE</small></div>
      <div className={styles.titleOrb}><p>PORTFOLIO</p><h1>{fullName}</h1><strong aria-hidden="true">ORBIT / 16</strong></div>
      <p className={styles.coverNote}>SELECTED WORK<br />FIELD NOTES</p>
    </header>
    <aside className={styles.contactBar} aria-label="Portfolio contact information"><ContactLine config={config} data={data} /></aside>
    <div className={styles.content}><OrderedSections config={config} data={data} flavor="bento" slots={{ summary: summarySlot }} /></div>
    <footer className={styles.footer}><span>ORBIT SKETCH / 16</span><span>SELECTED WORK / ARCHIVE</span></footer>
  </main>;
}
