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

export default function FuchsiaArchiveTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const sideLabels = config.sections.hidden.includes("skills")
    ? []
    : data.skills
        .flatMap((group) => [group.category, ...group.items])
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3);
  const summarySlot = (
    <section className={styles.intro} id="summary">
      <div>
        <p className={styles.index}>PROFILE / HELLO</p>
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
      data-theme-layout="pavni-fuchsia-archive"
      data-theme-pack="pavni"
      style={frameStyle(config)}
    >
      <header className={styles.cover}>
        <div aria-hidden="true" className={styles.checker} />
        <div aria-hidden="true" className={styles.blob} />
        <div aria-hidden="true" className={styles.star}>✦</div>
        <div aria-hidden="true" className={styles.tape} />
        <div className={styles.coverNav}>
          <span>ARCHIVE / 23</span><span>PERSONAL RECORD</span><span>PORTFOLIO</span>
        </div>
        <div className={styles.title}>
          <p>PORTFOLIO / SELECTED WORK</p>
          <h1>{fullName}</h1>
          {data.personal.headline.trim() ? <strong>{data.personal.headline}</strong> : null}
        </div>
        <div className={styles.photoCard}>
          <SafeProfileImage
            alt={`${fullName} portrait`}
            fallback={<span aria-label={`${fullName} initials`}>{getThemeInitials(fullName)}</span>}
            imageUrl={data.personal.profileImageUrl}
            showImage={config.visibility.showProfileImage}
          />
          <small>PHOTO NOTE / 23</small>
        </div>
        {sideLabels.length ? (
          <div className={styles.sideLabel}>
            {sideLabels.map((label) => <span key={label}>{label}</span>)}
          </div>
        ) : null}
        <p className={styles.coverNote}>PROJECTS<br />EXPERIENCE<br />DETAILS</p>
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
        <span>FUCHSIA ARCHIVE / 23</span><span>WORK / NOTES / RECORD</span>
      </footer>
    </main>
  );
}
