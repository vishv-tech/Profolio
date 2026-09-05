"use client";

import type { PointerEvent } from "react";

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

export default function WebverseCollageTheme({ data, config }: PavniThemeProps) {
  const frameProps = themeFrameProps(config, "pavni-webverse-collage");
  const isDynamic = frameProps["data-animation"] === "dynamic";
  const moveWeb = (event: PointerEvent<HTMLElement>) => {
    if (!isDynamic) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--cursor-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    event.currentTarget.style.setProperty("--cursor-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  };
  const portrait = config.visibility.showProfileImage ? (
    <SafeProfileImage
      alt={`${data.personal.fullName || "Portfolio owner"} portrait`}
      fallback={<span>{getThemeInitials(data.personal.fullName) || "PF"}</span>}
      imageUrl={data.personal.profileImageUrl}
      showImage
    />
  ) : <span aria-hidden="true">✦</span>;
  const summarySlot = (
    <section className={styles.manifesto} id="summary">
      <div className={styles.note}><span>THE PROFILE</span><b>01</b><p>Ideas connect here.</p></div>
      <div className={styles.manifestoCopy}>
        <SectionTitle flavor="creative">About</SectionTitle>
        <SectionContent data={data} flavor="creative" section="summary" />
      </div>
    </section>
  );

  return (
    <main
      className={`${foundation.root} ${styles.root}`}
      data-theme-layout="pavni-webverse-collage"
      onPointerMove={isDynamic ? moveWeb : undefined}
      {...frameProps}
    >
      <header className={styles.hero}>
        <div className={styles.paperNoise} aria-hidden="true" />
        <div className={styles.web} aria-hidden="true"><i /><i /><i /><i /></div>
        <div className={styles.slinger} aria-hidden="true"><span className={styles.thread} /><span className={styles.head}><i /><i /></span><span className={styles.torso} /><span className={`${styles.limb} ${styles.armLeft}`} /><span className={`${styles.limb} ${styles.armRight}`} /><span className={`${styles.limb} ${styles.legLeft}`} /><span className={`${styles.limb} ${styles.legRight}`} /></div>
        <p className={styles.issue}>{data.personal.fullName || "Portfolio"} / selected work</p>
        <p className={styles.sticker}>IDEAS<br />IN MOTION</p>
        <div className={styles.title}><span>YOUR</span><strong>WEB</strong><span>OF WORK</span></div>
        <div className={styles.identity}>
          <div className={styles.avatar}>{portrait}</div>
          <div><p>Meet the maker</p><h1>{data.personal.fullName || "Portfolio"}</h1><span>{data.personal.headline}</span></div>
        </div>
      </header>
      <section className={styles.contact} id="contact"><ContactLine config={config} data={data} /></section>
      <div className={styles.content}>
        <OrderedSections
          config={config}
          data={data}
          flavor="creative"
          slots={{ summary: summarySlot }}
        />
      </div>
      <footer className={styles.footer}><span>Connected ideas / selected work</span><span>&copy; {new Date().getFullYear()} {data.personal.fullName}</span></footer>
    </main>
  );
}
