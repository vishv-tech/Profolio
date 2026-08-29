"use client";

import type { PavniThemeProps } from "../types";
import { ContactLine, frameStyle, getThemeInitials, OrderedSections, SafeProfileImage, SectionContent } from "../shared";
import foundation from "../shared/foundation.module.css";
import styles from "./styles.module.css";

export default function BlueRedScriptTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const projectNotes = config.sections.hidden.includes("projects")
    ? []
    : data.projects.slice(0, 3).map((project) => project.name.trim()).filter(Boolean);
  const summarySlot = <section className={styles.intro} id="summary"><div><p className={styles.index}>PROFILE / FIRST NOTE</p><h2>{data.personal.headline || fullName}</h2></div><div className={styles.summary}><SectionContent data={data} flavor="bento" section="summary" /></div></section>;
  return <main className={`${foundation.root} ${styles.root}`} data-animation={config.appearance.animationIntensity} data-color-mode={config.appearance.colorMode} data-theme-layout="pavni-blue-red-script" style={frameStyle(config)}>
    <header className={styles.cover}><div className={styles.paperDots} aria-hidden="true" /><span className={styles.stroke} aria-hidden="true" />
      <div className={styles.coverNav}><span>NOTEBOOK / 20</span><span>{fullName.toUpperCase()}</span><span>PORTFOLIO</span></div>
      <div className={styles.title}><h1>{fullName}</h1><p>PERSONAL ARCHIVE / 20</p>{data.personal.headline.trim() ? <strong>{data.personal.headline}</strong> : null}</div>
      <div className={styles.noteLeft}>{projectNotes.length ? projectNotes.map((note) => <span key={note}>{note}</span>) : <><span>SELECTED WORK</span><span>PROJECT NOTES</span></>}</div>
      <div className={styles.noteRight}>PROFILE<br />PROCESS<br />PROGRESS</div>
      <div className={styles.photoNote}><SafeProfileImage alt={`${fullName} portrait`} fallback={<span aria-label={`${fullName} initials`}>{getThemeInitials(fullName)}</span>} imageUrl={data.personal.profileImageUrl} showImage={config.visibility.showProfileImage} /><i aria-hidden="true" /></div>
      <p className={styles.coverNote}>WORK / NOTES<br />ARCHIVE / INDEX</p><span className={styles.scrollCue}>OPEN THE NOTES</span>
    </header>
    <aside className={styles.contactBar} aria-label="Portfolio contact information"><ContactLine config={config} data={data} /></aside>
    <div className={styles.content}><OrderedSections config={config} data={data} flavor="bento" slots={{ summary: summarySlot }} /></div>
    <footer className={styles.footer}><span>BLUE RED SCRIPT / 20</span><span>PROFILE / WORK / NOTES</span></footer>
  </main>;
}
