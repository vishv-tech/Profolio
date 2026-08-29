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

export default function ColorCutoutTheme({ data, config }: PavniThemeProps) {
  const fullName = data.personal.fullName.trim() || "Portfolio owner";
  const titleLetters = fullName.toUpperCase().split("");

  return (
    <main
      className={`${foundationStyles.root} ${styles.root}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout="pavni-color-cutout"
      data-theme-pack="pavni"
      style={frameStyle(config)}
    >
      <header className={styles.cover}>
        <div aria-hidden="true" className={styles.paperSun} />
        <div aria-hidden="true" className={styles.blueBlock} />
        <div aria-hidden="true" className={styles.scribble}>✳</div>
        <nav aria-label="Portfolio introduction">
          <span>COLLAGE / 13</span><span>SELECTED STORIES</span><span>MAKE IT BRIGHT</span>
        </nav>
        <div className={styles.title}>
          <p>SELECTED WORK BY</p>
          <h1 aria-label={fullName}>
            {titleLetters.map((letter, index) => (
              <span aria-hidden="true" key={`${letter}-${index}`}>{letter === " " ? " " : letter}</span>
            ))}
          </h1>
          <strong>{fullName}</strong>
        </div>
        <div className={styles.profileCard}>
          <div aria-hidden="true" className={styles.tape} />
          <div className={styles.profilePhoto}>
            {config.visibility.showProfileImage ? (
              <SafeProfileImage
                alt={`${fullName} portrait`}
                fallback={<span>{getThemeInitials(fullName)}</span>}
                imageUrl={data.personal.profileImageUrl}
                showImage
              />
            ) : (
              <span aria-hidden="true">✦</span>
            )}
          </div>
          <small>IDEAS IN MOTION</small>
        </div>
        {data.personal.headline.trim() ? (
          <p className={styles.coverNote}>{data.personal.headline}</p>
        ) : null}
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
                  <p className={styles.index}>HELLO</p>
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
        <span>Shapes, stories, and selected details.</span><span>COLOR CUTOUT / 13</span>
      </footer>
    </main>
  );
}
