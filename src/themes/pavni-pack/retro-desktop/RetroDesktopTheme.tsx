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

export default function RetroDesktopTheme({ data, config }: PavniThemeProps) {
  const dynamicMotion = config.appearance.animationIntensity === "dynamic";
  const fullName = data.personal.fullName.trim() || "Portfolio owner";

  const moveCursor = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--mouse-x",
      `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
    );
    event.currentTarget.style.setProperty(
      "--mouse-y",
      `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
    );
  };

  return (
    <main
      className={`${foundationStyles.root} ${styles.root}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout="pavni-retro-desktop"
      data-theme-pack="pavni"
      onPointerMove={dynamicMotion ? moveCursor : undefined}
      style={frameStyle(config)}
    >
      {dynamicMotion ? <span aria-hidden="true" className={styles.cursor} /> : null}

      <header className={styles.desktop}>
        <div aria-hidden="true" className={styles.iconColumn}>
          <span className={styles.shortcut}><i>✦</i><b>about.txt</b></span>
          <span className={styles.shortcut}><i>↗</i><b>work.exe</b></span>
          <span className={styles.shortcut}><i>?</i><b>skills.sys</b></span>
        </div>

        <section className={styles.welcomeWindow}>
          <div className={styles.titleBar}>
            <span>Welcome — Read me first.txt</span>
            <b aria-hidden="true">×</b>
          </div>
          <div className={styles.windowBody}>
            <div className={styles.identityGrid}>
              <div>
                <p>Hi, I&apos;m</p>
                <h1>{fullName}</h1>
                {data.personal.headline.trim() ? (
                  <strong>{data.personal.headline}</strong>
                ) : null}
              </div>
              {config.visibility.showProfileImage ? (
                <div className={styles.portrait}>
                  <SafeProfileImage
                    alt={`${fullName} portrait`}
                    fallback={<span>{getThemeInitials(fullName)}</span>}
                    imageUrl={data.personal.profileImageUrl}
                    showImage
                  />
                </div>
              ) : null}
            </div>
            <p className={styles.bootText}>
              A personal space for selected work, ideas, and useful details.
            </p>
            <ContactLine config={config} data={data} />
          </div>
        </section>

        <p className={styles.desktopHint}>
          {dynamicMotion ? <>Move around the desktop<br />to wake the pointer</> : "Portfolio desktop"}
        </p>
        <div className={styles.taskbar}>
          <b><i aria-hidden="true">⊞</i> Start</b>
          <span>{data.personal.headline.trim() || "Portfolio archive"}</span>
          <strong>ONLINE</strong>
        </div>
      </header>

      <div className={styles.workspace}>
        <OrderedSections
          config={config}
          data={data}
          flavor="creative"
          slots={{
            summary: (
              <section className={styles.aboutWindow} id="summary">
                <div className={styles.titleBar}>
                  <span>about_me.txt</span>
                  <b aria-hidden="true">×</b>
                </div>
                <div>
                  <p className={styles.sectionKicker}>System overview</p>
                  <SectionContent data={data} flavor="creative" section="summary" />
                </div>
              </section>
            ),
            projects: (
              <section className={styles.projectsWindow} id="projects">
                <div className={styles.titleBar}>
                  <span>selected_work.exe</span>
                  <b aria-hidden="true">×</b>
                </div>
                <div className={styles.windowBody}>
                  <p className={styles.sectionKicker}>Selected project files</p>
                  <SectionContent data={data} flavor="creative" section="projects" />
                </div>
              </section>
            ),
          }}
        />
      </div>

      <footer className={styles.footer}>
        <span><b aria-hidden="true">⊞</b> Start</span>
        <strong>System status: ready to explore.</strong>
        <span>{fullName} · portfolio</span>
      </footer>
    </main>
  );
}
