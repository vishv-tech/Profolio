"use client";

import type { PavniThemeProps } from "../types";
import {
  ContactLine,
  frameStyle,
  getThemeInitials,
  OrderedSections,
  SafeProfileImage,
  SectionContent,
} from "../shared";
import foundation from "../shared/foundation.module.css";

import styles from "./styles.module.css";

export default function MonoEchoTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Untitled portfolio";
  const summarySlot = (
    <section className={styles.intro} id="summary">
      <div className={styles.profile}>
        <SafeProfileImage
          alt={`${fullName} portrait`}
          fallback={
            <span aria-label={`${fullName} initials`}>
              {getThemeInitials(fullName)}
            </span>
          }
          imageUrl={data.personal.profileImageUrl}
          showImage={config.visibility.showProfileImage}
        />
      </div>
      <div>
        <p className={styles.index}>PROFILE / INTRODUCTION</p>
        <h2>{data.personal.headline || fullName}</h2>
        <SectionContent data={data} flavor="bento" section="summary" />
      </div>
    </section>
  );

  return (
    <main
      className={`${foundation.root} ${styles.root}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout="pavni-mono-echo"
      style={frameStyle(config)}
    >
      <header className={styles.cover}>
        <div className={styles.coverNav}>
          <span>MONO / 14</span><span>SELECTED WORK</span><span>PORTFOLIO</span>
        </div>
        <div className={styles.wordEcho}>
          <h1>{fullName}</h1>
          <span aria-hidden="true">{fullName}</span>
          <span aria-hidden="true">{fullName}</span>
          <span aria-hidden="true">{fullName}</span>
        </div>
        <div className={styles.coverFoot}>
          <span>{fullName}</span><span>MONOCHROME EDITION</span><span>SCROLL TO EXPLORE</span>
        </div>
      </header>
      <aside className={styles.contactBar} aria-label="Portfolio contact information">
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
        <span>MONO ECHO / 14</span><span>SELECTED WORK / ARCHIVE</span>
      </footer>
    </main>
  );
}
