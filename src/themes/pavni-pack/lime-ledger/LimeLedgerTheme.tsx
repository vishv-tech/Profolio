"use client";

import type { PavniThemeProps } from "../types";
import { ContactLine, frameStyle, getThemeInitials, OrderedSections, SafeProfileImage, SectionContent } from "../shared";
import foundation from "../shared/foundation.module.css";
import styles from "./styles.module.css";

export default function LimeLedgerTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const skillLabels = config.sections.hidden.includes("skills")
    ? []
    : data.skills.flatMap((group) => [group.category, ...group.items]).map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const summarySlot = <section className={styles.intro} id="summary"><div><p className={styles.index}>PROFILE / LEDGER NOTE</p><h2>{data.personal.headline || fullName}</h2></div><div className={styles.summary}><SectionContent data={data} flavor="bento" section="summary" /></div></section>;
  return <main className={`${foundation.root} ${styles.root}`} data-animation={config.appearance.animationIntensity} data-color-mode={config.appearance.colorMode} data-theme-layout="pavni-lime-ledger" style={frameStyle(config)}>
    <header className={styles.cover}><div className={styles.grid} aria-hidden="true" /><div className={styles.limeRail} aria-hidden="true" /><div className={styles.stamp} aria-hidden="true">✦</div>
      <div className={styles.coverNav}><span>LEDGER / 21</span><span>PROJECT INDEX</span><span>PORTFOLIO</span></div>
      <div className={styles.title}><p>PORTFOLIO / SELECTED WORK</p><h1>{fullName}</h1>{data.personal.headline.trim() ? <strong>{data.personal.headline}</strong> : null}</div>
      <div className={styles.photoBlock}><SafeProfileImage alt={`${fullName} portrait`} fallback={<span aria-label={`${fullName} initials`}>{getThemeInitials(fullName)}</span>} imageUrl={data.personal.profileImageUrl} showImage={config.visibility.showProfileImage} /><small>PROFILE / 01</small></div>
      {skillLabels.length ? <div className={styles.sideCopy}>{skillLabels.map((label) => <span key={label}>{label}</span>)}</div> : null}
      <p className={styles.coverNote}>PROJECTS<br />EXPERIENCE<br />SKILLS</p><span className={styles.scrollCue}>READ ON</span>
    </header>
    <aside className={styles.contactBar} aria-label="Portfolio contact information"><ContactLine config={config} data={data} /></aside>
    <div className={styles.content}><OrderedSections config={config} data={data} flavor="bento" slots={{ summary: summarySlot }} /></div>
    <footer className={styles.footer}><span>LIME LEDGER / 21</span><span>WORK / RECORD / ARCHIVE</span></footer>
  </main>;
}
