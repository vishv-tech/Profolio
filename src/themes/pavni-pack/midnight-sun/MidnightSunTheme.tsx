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

export default function MidnightSunTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const summarySlot = (
    <section className={styles.intro} id="summary">
      <div>
        <p className={styles.index}>PROFILE / OPENING NOTE</p>
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
      data-theme-layout="pavni-midnight-sun"
      data-theme-pack="pavni"
      style={frameStyle(config)}
    >
      <header className={styles.cover}>
        <div aria-hidden="true" className={styles.paper} />
        <div aria-hidden="true" className={styles.sun} />
        <div aria-hidden="true" className={styles.rays}><i /><i /><i /><i /></div>
        <div className={styles.coverNav}>
          <span>SUN / 22</span><span>SELECTED WORK</span><span>PORTFOLIO</span>
        </div>
        <div className={styles.title}>
          <p>PORTFOLIO / SELECTED WORK</p>
          <h1>{fullName}</h1>
          {data.personal.headline.trim() ? <strong>{data.personal.headline}</strong> : null}
        </div>
        <div className={styles.photoOrbit}>
          <div className={styles.photoFrame}>
            <SafeProfileImage
              alt={`${fullName} portrait`}
              fallback={<span aria-label={`${fullName} initials`}>{getThemeInitials(fullName)}</span>}
              imageUrl={data.personal.profileImageUrl}
              showImage={config.visibility.showProfileImage}
            />
          </div>
          <i aria-hidden="true" /><i aria-hidden="true" />
        </div>
        <p className={styles.coverNote}>PROJECTS<br />EXPERIENCE<br />SKILLS</p>
        <span className={styles.scrollCue}>READ ON</span>
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
        <span>MIDNIGHT SUN / 22</span><span>WORK / RECORD / ARCHIVE</span>
      </footer>
    </main>
  );
}
