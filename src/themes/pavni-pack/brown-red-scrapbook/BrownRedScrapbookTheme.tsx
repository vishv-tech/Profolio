"use client";

import {
  ContactLine,
  getThemeInitials,
  OrderedSections,
  SafeProfileImage,
  SectionContent,
  SectionTitle,
  themeFrameProps,
} from "../shared";
import foundation from "../shared/foundation.module.css";
import type { PavniThemeProps } from "../types";
import styles from "./styles.module.css";

export default function BrownRedScrapbookTheme({ data, config }: PavniThemeProps) {
  const initials = getThemeInitials(data.personal.fullName);
  const portrait = (decorative = false) => config.visibility.showProfileImage ? (
    <SafeProfileImage
      alt={decorative ? "" : `${data.personal.fullName || "Portfolio owner"} portrait`}
      fallback={<span aria-hidden={decorative}>{initials || "PF"}</span>}
      imageUrl={data.personal.profileImageUrl}
      showImage
    />
  ) : <span aria-hidden="true">✦</span>;

  const summarySlot = (
    <section className={styles.about} id="summary">
      <p className={styles.sectionLabel}>A little bit about this profile</p>
      <div className={styles.aboutCopy}>
        <SectionTitle flavor="bento">About</SectionTitle>
        <SectionContent data={data} flavor="bento" section="summary" />
      </div>
    </section>
  );

  return (
    <main
      className={`${foundation.root} ${styles.root}`}
      data-theme-layout="pavni-brown-red-scrapbook"
      {...themeFrameProps(config, "pavni-brown-red-scrapbook")}
    >
      <header className={styles.cover}>
        <p className={styles.handle}>Portfolio notes / collected work</p>
        <div className={`${styles.polaroid} ${styles.topPhoto}`}>{portrait()}</div>
        <div className={styles.coverTitle}>
          <p>Selected work, notes &amp; ideas</p>
          <h1>{data.personal.fullName || "Portfolio"}</h1>
          <span>{data.personal.headline}</span>
        </div>
        <div aria-hidden="true" className={`${styles.polaroid} ${styles.sidePhoto}`}>{portrait(true)}</div>
        <div className={styles.cutout} aria-hidden="true">✦</div>
      </header>

      <section className={styles.contactNote} id="contact">
        <span>Hello</span>
        <p>{data.personal.headline}</p>
        <ContactLine config={config} data={data} />
      </section>
      <div className={styles.content}>
        <OrderedSections
          config={config}
          data={data}
          flavor="bento"
          slots={{ summary: summarySlot }}
        />
      </div>
      <footer className={styles.footer}><span>Stories, scraps &amp; selected work.</span><span>Portfolio ✷</span></footer>
    </main>
  );
}
