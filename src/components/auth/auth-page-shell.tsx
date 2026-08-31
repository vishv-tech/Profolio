import { FileText } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./auth-page-shell.module.css";

type AuthPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthPageShell({
  title,
  description,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <aside className={styles.story} aria-label="About Profolio">
          <Link
            className={styles.storyBrand}
            href="/"
          >
            <span className={styles.brandMark}>
              <FileText aria-hidden="true" className="size-4" />
            </span>
            Profolio
          </Link>
          <div className={styles.storyCopy}>
            <p className={styles.eyebrow}>Your work, thoughtfully presented</p>
            <p className={styles.storyTitle}>From resume to remarkable.</p>
            <p className={styles.storyText}>
              Shape your experience into a portfolio that feels personal,
              polished, and ready to share.
            </p>
          </div>
          <div className={styles.portfolioMotif} aria-hidden="true">
            <div className={styles.resumeCard}>
              <div className={styles.resumeHeader}>
                <span className={styles.resumeAvatar} />
                <span className={styles.lineStack}><span /><span /></span>
              </div>
              <span className={styles.resumeLines}><span /><span /><span /><span /></span>
            </div>
            <div className={styles.portfolioCard}><span /><span /><span /></div>
          </div>
        </aside>

        <section className={styles.formPanel}>
          <div className={styles.formInner}>
            <Link className={styles.mobileBrand} href="/">
              <span className={styles.brandMark}>
                <FileText aria-hidden="true" className="size-4" />
              </span>
              Profolio
            </Link>
            <p className={styles.formEyebrow}>Welcome to Profolio</p>
            <h1 className={styles.formTitle}>{title}</h1>
            <p className={styles.formDescription}>{description}</p>
            <div className={styles.formContent}>{children}</div>
            <div className={styles.footer}>{footer}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
