"use client";

import foundationStyles from "@/themes/pavni-pack/shared/foundation.module.css";
import {
  ContactLine,
  frameStyle,
  getThemeInitials,
  OrderedSections,
  SafeProfileImage,
  SectionContent,
} from "@/themes/pavni-pack/shared";
import type { PavniThemeProps } from "@/themes/pavni-pack/types";

import styles from "./styles.module.css";

export default function StripedNotesTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Portfolio owner";

  return (
    <main
      className={`${foundationStyles.root} ${styles.root}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout="pavni-striped-notes"
      data-theme-pack="pavni"
      style={frameStyle(config)}
    >
      <header className={styles.cover}>
        <div aria-hidden="true" className={styles.stripes} />
        <nav aria-label="Portfolio introduction">
          <span>STUDIO / 12</span><span>PERSONAL ARCHIVE</span><span>PORTFOLIO</span>
        </nav>
        <div className={styles.yearTag}>12</div>
        <div className={styles.coverTitle}>
          <p>portfolio</p><h1>{fullName}</h1><strong>{fullName}</strong>
        </div>
        <div className={styles.photoNote}>
          <i aria-hidden="true" />
          <div className={styles.photo}>
            {config.visibility.showProfileImage ? (
              <SafeProfileImage
                alt={`${fullName} portrait`}
                fallback={<span>{getThemeInitials(fullName)}</span>}
                imageUrl={data.personal.profileImageUrl}
                showImage
              />
            ) : (
              <span aria-hidden="true">✳</span>
            )}
          </div>
          <small>SELECTED STORIES</small>
        </div>
        <div aria-hidden="true" className={styles.flower}>✳</div>
      </header>

      <div className={styles.content}>
        <OrderedSections
          config={config}
          data={data}
          flavor="bento"
          slots={{
            summary: (
              <section className={styles.about} id="summary">
                <div>
                  <p className={styles.sectionNo}>ABOUT</p>
                  <h2>A little note<br />about this portfolio.</h2>
                </div>
                <div className={styles.summary}>
                  <SectionContent data={data} flavor="bento" section="summary" />
                </div>
                <div className={styles.contact}>
                  <p>KEEP IN TOUCH</p><ContactLine config={config} data={data} />
                </div>
              </section>
            ),
          }}
        />
      </div>
      <footer className={styles.footer}>
        <span>Notes, details, and selected work.</span><span>12 / 12 ✷</span>
      </footer>
    </main>
  );
}
