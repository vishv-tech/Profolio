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

export default function BlueBeigeFoldersTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Portfolio owner";

  return (
    <main
      className={`${foundationStyles.root} ${styles.root}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout="pavni-blue-beige-folders"
      data-theme-pack="pavni"
      style={frameStyle(config)}
    >
      <header className={styles.cover}>
        <div className={`${styles.folder} ${styles.backFolder}`} aria-hidden="true" />
        <div className={`${styles.folder} ${styles.middleFolder}`} aria-hidden="true" />
        <div className={`${styles.folder} ${styles.frontFolder}`}>
          <nav aria-label="Portfolio introduction">
            <span>ARCHIVE / 11</span><span>SELECTED RECORD</span><span>PORTFOLIO</span>
          </nav>
          <div className={styles.titleBlock}>
            <p>COLLECTED WORK OF</p><h1>{fullName}</h1><strong>{fullName}</strong>
          </div>
          <div className={styles.photoStack}>
            <div aria-hidden="true" className={styles.clip} />
            <div className={styles.photoFrame}>
              {config.visibility.showProfileImage ? (
                <SafeProfileImage
                  alt={`${fullName} portrait`}
                  fallback={<span>{getThemeInitials(fullName)}</span>}
                  imageUrl={data.personal.profileImageUrl}
                  showImage
                />
              ) : (
                <span aria-hidden="true">⌑</span>
              )}
            </div>
            <small>PROFILE</small>
          </div>
          <p className={styles.coverNote}>A quiet archive for selected work.</p>
        </div>
      </header>

      <div className={styles.content}>
        <OrderedSections
          config={config}
          data={data}
          flavor="bento"
          slots={{
            summary: (
              <section className={styles.intro} id="summary">
                <div>
                  <p className={styles.index}>ABOUT</p>
                  {data.personal.headline.trim() ? <h2>{data.personal.headline}</h2> : null}
                </div>
                <div className={styles.summary}>
                  <SectionContent data={data} flavor="bento" section="summary" />
                </div>
                <ContactLine config={config} data={data} />
              </section>
            ),
          }}
        />
      </div>
      <footer className={styles.footer}>
        <span>Filed with care · designed to be explored.</span><span>ARCHIVE 11 ↗</span>
      </footer>
    </main>
  );
}
