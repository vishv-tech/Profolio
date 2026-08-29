"use client";

import {
  ContactLine,
  frameStyle,
  OrderedSections,
  ProfileIdentity,
  SectionContent,
  SectionTitle,
} from "../shared";
import foundation from "../shared/foundation.module.css";
import type { PavniThemeProps } from "../types";
import styles from "./styles.module.css";

export default function DynamicBentoTheme({ data, config }: PavniThemeProps) {
  const slots = {
    summary: (
      <section className={`${styles.card} ${styles.summary}`} id="summary">
        <SectionTitle flavor="bento">About</SectionTitle>
        <SectionContent data={data} flavor="bento" section="summary" />
      </section>
    ),
    projects: (
      <section className={`${styles.card} ${styles.projects}`} id="projects">
        <SectionTitle flavor="bento">Selected projects</SectionTitle>
        <SectionContent data={data} flavor="bento" section="projects" />
      </section>
    ),
    skills: (
      <section className={`${styles.card} ${styles.skills}`} id="skills">
        <SectionTitle flavor="bento">Skills</SectionTitle>
        <SectionContent data={data} flavor="bento" section="skills" />
      </section>
    ),
    experience: (
      <section className={`${styles.card} ${styles.experience}`} id="experience">
        <SectionTitle flavor="bento">Experience</SectionTitle>
        <SectionContent data={data} flavor="bento" section="experience" />
      </section>
    ),
  };

  return (
    <main
      className={`${foundation.root} ${styles.root}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout="pavni-dynamic-bento"
      style={frameStyle(config)}
    >
      <header className={styles.intro}>
        <span className={styles.dot} aria-hidden="true" />
        <ProfileIdentity config={config} data={data} flavor="bento" />
        <ContactLine config={config} data={data} />
      </header>
      <div className={styles.grid}>
        <OrderedSections config={config} data={data} flavor="bento" slots={slots} />
      </div>
    </main>
  );
}
