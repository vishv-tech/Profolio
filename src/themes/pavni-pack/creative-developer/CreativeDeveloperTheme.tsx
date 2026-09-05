"use client";

import { ContactLine, OrderedSections, ProfileIdentity, themeFrameProps } from "../shared";
import foundation from "../shared/foundation.module.css";
import type { PavniThemeProps } from "../types";
import styles from "./styles.module.css";

export default function CreativeDeveloperTheme({ data, config }: PavniThemeProps) {
  return (
    <main
      className={`${foundation.root} ${styles.root}`}
      data-theme-layout="pavni-creative-developer"
      {...themeFrameProps(config, "pavni-creative-developer")}
    >
      <div className={styles.grid} aria-hidden="true" />
      <header className={styles.header}>
        <p className={styles.tag}>&lt; portfolio.profile /&gt;</p>
        <ProfileIdentity config={config} data={data} flavor="creative" />
        <ContactLine config={config} data={data} />
        <p className={styles.scroll} aria-hidden="true">scroll for the story <span>↓</span></p>
      </header>
      <div className={styles.content}>
        <OrderedSections config={config} data={data} flavor="creative" />
      </div>
      <footer className={styles.footer}>Portfolio index <span aria-hidden="true">✦</span></footer>
    </main>
  );
}
