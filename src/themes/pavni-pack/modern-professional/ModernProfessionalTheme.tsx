"use client";

import { ContactLine, frameStyle, OrderedSections } from "../shared";
import foundation from "../shared/foundation.module.css";
import { getThemeInitials } from "../shared";
import type { PavniThemeProps } from "../types";
import styles from "./styles.module.css";

export default function ModernProfessionalTheme({ data, config }: PavniThemeProps) {
  return (
    <main
      className={`${foundation.root} ${styles.root}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout="pavni-modern-professional"
      style={frameStyle(config)}
    >
      <header className={styles.hero}>
        <nav aria-label="Portfolio context">
          <span className={styles.wordmark}>{getThemeInitials(data.personal.fullName) || "PF"}.</span>
          <span>Selected work</span>
          <span>{data.personal.fullName || "Portfolio"}</span>
        </nav>
        <div className={styles.contours} aria-hidden="true"><i /><i /><i /><i /></div>
        <div className={styles.heroCopy}>
          <p>Professional profile</p>
          <h1>{data.personal.fullName || "Untitled portfolio"}</h1>
          <strong aria-hidden="true">Selected work</strong>
          <div>
            <span>{data.personal.headline}</span>
            <ContactLine config={config} data={data} />
          </div>
        </div>
      </header>
      <div className={styles.content}>
        <OrderedSections config={config} data={data} flavor="modern" />
      </div>
    </main>
  );
}
