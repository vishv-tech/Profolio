import type { CSSProperties } from "react";
import { Activity, CircuitBoard } from "lucide-react";

import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";
import styles from "../shared/career-studio.module.css";

function revealStyle(index: number): CSSProperties {
  return { "--item-index": index } as CSSProperties;
}

export default function ElectricalEngineerTheme({
  data,
  config,
}: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell
      className={`${styles.root} ${styles.electrical}`}
      config={config}
      layoutKey="career-electrical-engineer"
    >
      <div className={styles.electricalFrame}>
        <div className={styles.signalBar} data-reveal style={revealStyle(0)}>
          <span>Signal portfolio / online</span>
          <span className={styles.signalDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>

        <div
          className={styles.electricalHeroStage}
          data-reveal
          style={revealStyle(1)}
        >
          <PortfolioHeader
            className={styles.electricalHero}
            config={config}
            data={data}
            imageClassName="rounded-[var(--career-radius)]"
          />
          <div className={styles.electricalSchematic} aria-hidden="true">
            <CircuitBoard className={styles.electricalBoardIcon} />
            <Activity className={styles.electricalWaveIcon} />
            <svg viewBox="0 0 360 150">
              <path
                className={styles.electricalTrace}
                d="M8 102h58V54h72v58h68V35h72v67h74"
              />
              <path
                className={styles.electricalTraceSecondary}
                d="M8 128h94V82h70v46h92V72h88"
              />
              <g className={styles.electricalNodes}>
                <circle cx="66" cy="102" r="5" />
                <circle cx="138" cy="54" r="5" />
                <circle cx="206" cy="112" r="5" />
                <circle cx="278" cy="35" r="5" />
                <circle cx="264" cy="128" r="5" />
              </g>
            </svg>
          </div>
        </div>

        <main className={styles.electricalGrid}>
          {sections.map((sectionKey, index) => (
            <div
              className={`${styles.sectionCard} ${styles.electricalSection}`}
              data-reveal
              key={sectionKey}
              style={revealStyle(index + 2)}
            >
              <SectionRenderer data={data} sectionKey={sectionKey} />
            </div>
          ))}
        </main>
      </div>
    </ThemeShell>
  );
}
