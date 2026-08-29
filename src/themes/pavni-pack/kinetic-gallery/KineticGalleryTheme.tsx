"use client";

import type { PointerEvent } from "react";

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

export default function KineticGalleryTheme({ data, config }: PavniThemeProps) {
  const dynamicMotion = config.appearance.animationIntensity === "dynamic";
  const fullName = data.personal.fullName.trim() || "Portfolio owner";

  const moveLens = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--lens-x",
      `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
    );
    event.currentTarget.style.setProperty(
      "--lens-y",
      `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
    );
  };

  return (
    <main
      className={`${foundationStyles.root} ${styles.root}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout="pavni-kinetic-gallery"
      data-theme-pack="pavni"
      onPointerMove={dynamicMotion ? moveLens : undefined}
      style={frameStyle(config)}
    >
      <header className={styles.hero}>
        <div aria-hidden="true" className={styles.lens} />
        <div aria-hidden="true" className={styles.noise} />
        <nav aria-label="Portfolio introduction">
          <span>KG / 10</span><span>Selected work</span><span>Scroll to enter ↓</span>
        </nav>
        <div className={styles.heroCopy}>
          <p>EXHIBIT 10 — THE KINETIC GALLERY</p>
          <h1>
            {fullName.split(/\s+/).map((part, index) => (
              <span key={`${part}-${index}`}>
                {part}{index === 0 ? <i aria-hidden="true">✦</i> : null}
              </span>
            ))}
          </h1>
          {data.personal.headline.trim() ? <strong>{data.personal.headline}</strong> : null}
          <div className={styles.heroContact}>
            <ContactLine config={config} data={data} />
          </div>
        </div>
        <div className={styles.sculpture}>
          <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
          <div className={styles.portraitOrb}>
            {config.visibility.showProfileImage ? (
              <SafeProfileImage
                alt={`${fullName} portrait`}
                fallback={<span>{getThemeInitials(fullName)}</span>}
                imageUrl={data.personal.profileImageUrl}
                showImage
              />
            ) : (
              <span aria-hidden="true">◒</span>
            )}
          </div>
        </div>
        <p className={styles.lensNote}>
          {dynamicMotion ? <>THE COLOR LENS<br />FOLLOWS YOU</> : "COLOR IN MOTION"}
        </p>
      </header>

      <div className={styles.content}>
        <OrderedSections
          config={config}
          data={data}
          flavor="bento"
          slots={{
            summary: (
              <section className={styles.intro} id="summary">
                <div className={styles.index}>01</div>
                <div>
                  <p className={styles.kicker}>The work, in motion</p>
                  <SectionContent data={data} flavor="bento" section="summary" />
                </div>
              </section>
            ),
          }}
        />
      </div>
      <footer className={styles.footer}>
        <span>Designed as an experience, not a document.</span>
        <span>Explore the next signal ↗</span>
      </footer>
    </main>
  );
}
