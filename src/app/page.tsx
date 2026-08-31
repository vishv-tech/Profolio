import {
  ArrowRight,
  BarChart3,
  Check,
  FileSearch,
  FileText,
  LayoutTemplate,
  PenLine,
  Rocket,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import styles from "./page.module.css";

const steps = [
  {
    number: "01",
    title: "Upload your resume",
    description: "Start with the experience you already have, in the format you already use.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Review every detail",
    description: "Shape the story, refine the wording, and stay in control of what goes live.",
    icon: PenLine,
  },
  {
    number: "03",
    title: "Choose your look",
    description: "Explore thoughtful themes built for different careers and personalities.",
    icon: LayoutTemplate,
  },
  {
    number: "04",
    title: "Publish with confidence",
    description: "Share one polished link, then keep improving as your work grows.",
    icon: Rocket,
  },
] as const;

const benefits = [
  {
    title: "AI-assisted extraction",
    description: "Turn resume details into structured portfolio content without starting from a blank page.",
    icon: FileSearch,
  },
  {
    title: "Everything stays editable",
    description: "Review, rewrite, reorder, and add the context that makes your work distinctly yours.",
    icon: PenLine,
  },
  {
    title: "A theme for every story",
    description: "Move from quiet editorial layouts to expressive creative systems without rebuilding content.",
    icon: Sparkles,
  },
  {
    title: "Ready to share",
    description: "Publish a personal URL and understand how your portfolio is performing over time.",
    icon: BarChart3,
  },
] as const;

function Brand() {
  return (
    <span className={styles.brandLockup}>
      <span aria-hidden="true" className={styles.brandMark}>
        <span />
        <span />
      </span>
      <span>Profolio</span>
    </span>
  );
}

function ResumePhone() {
  return (
    <div className={styles.phoneWrap}>
      <div className={styles.deviceLabel}>
        <span>01</span>
        Resume in
      </div>
      <div aria-label="Resume PDF preview" className={styles.phone}>
        <div className={styles.phoneNotch} />
        <div className={styles.phoneScreen}>
          <div className={styles.pdfBar}>
            <span className={styles.pdfIcon}>PDF</span>
            <span>resume.pdf</span>
          </div>
          <div className={styles.resumeSheet}>
            <div className={styles.resumeHeading}>
              <span className={styles.resumeAvatar}>TA</span>
              <span>
                <strong>The Architects</strong>
                <small>Product design collective</small>
              </span>
            </div>
            <div className={styles.resumeRule} />
            <small>EXPERIENCE</small>
            <strong className={styles.resumeRole}>Lead product designer</strong>
            <span className={styles.resumeLine} />
            <span className={styles.resumeLineShort} />
            <small>SELECTED WORK</small>
            <span className={styles.resumeLine} />
            <span className={styles.resumeLineMedium} />
            <span className={styles.resumeLineShort} />
          </div>
          <div className={styles.uploadStatus}>
            <span className={styles.statusCheck}>
              <Check aria-hidden="true" />
            </span>
            <span>
              <strong>Ready to transform</strong>
              <small>Resume uploaded</small>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioLaptop() {
  return (
    <div className={styles.laptopWrap}>
      <div className={styles.deviceLabel}>
        <span>02</span>
        Portfolio out
      </div>
      <div aria-label="Published portfolio website preview" className={styles.laptop}>
        <div className={styles.laptopScreen}>
          <div className={styles.browserBar}>
            <span className={styles.browserDots}>
              <i />
              <i />
              <i />
            </span>
            <span className={styles.browserAddress}>profolio.app/the-architects</span>
          </div>
          <div className={styles.portfolioPreview}>
            <nav className={styles.previewNav}>
              <span className={styles.previewMonogram}>TA.</span>
              <span>Work&nbsp;&nbsp;&nbsp; About&nbsp;&nbsp;&nbsp; Contact</span>
            </nav>
            <div className={styles.previewHero}>
              <div>
                <span className={styles.availablePill}>Available for selected work</span>
                <h2>Designing clarity into digital products.</h2>
                <p>We turn complex ideas into calm, useful experiences that people remember.</p>
              </div>
              <div className={styles.previewPortrait}>
                <span>THE</span>
                <strong>ARCHITECTS</strong>
              </div>
            </div>
            <div className={styles.previewProjects}>
              <article>
                <span>01 / Product</span>
                <strong>Northstar systems</strong>
              </article>
              <article>
                <span>02 / Brand</span>
                <strong>Field notes</strong>
              </article>
              <article>
                <span>03 / Research</span>
                <strong>Human signals</strong>
              </article>
            </div>
          </div>
        </div>
        <div className={styles.laptopBase} />
      </div>
    </div>
  );
}

function ProductShowcase() {
  return (
    <div className={styles.showcase}>
      <div aria-hidden="true" className={styles.showcaseOrb} />
      <div aria-hidden="true" className={styles.transformLine}>
        <span>resume</span>
        <ArrowRight />
        <span>portfolio</span>
      </div>
      <PortfolioLaptop />
      <ResumePhone />
      <div className={styles.showcaseNote}>
        <Sparkles aria-hidden="true" />
        <span>
          <strong>Your experience.</strong>
          Beautifully presented.
        </span>
      </div>
    </div>
  );
}

function ThemeArtwork({ variant }: { variant: "sage" | "clay" | "ink" }) {
  return (
    <div className={`${styles.themeArtwork} ${styles[variant]}`}>
      <div className={styles.artworkNav}>
        <span>PORTFOLIO</span>
        <span>•••</span>
      </div>
      <div className={styles.artworkBody}>
        <span className={styles.artworkIndex}>01—25</span>
        <h3>{variant === "sage" ? "Thoughtful work." : variant === "clay" ? "Ideas in motion." : "Built with intent."}</h3>
        <p>Selected projects, experience, and the story behind the work.</p>
        <div className={styles.artworkTiles}>
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className={styles.page} id="top">
      <header className={styles.header}>
        <Link aria-label="Profolio home" className={styles.brandLink} href="/">
          <Brand />
        </Link>
        <nav aria-label="Primary navigation" className={styles.navigation}>
          <a href="#top">Home</a>
          <a href="#features">Features</a>
          <a href="#themes">Themes</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.loginLink} href="/login">Log in</Link>
          <Link className={styles.smallCta} href="/signup">
            Create account
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span />
            Your career deserves more than a PDF
          </p>
          <h1>
            Turn your resume into a portfolio <em>worth remembering.</em>
          </h1>
          <p className={styles.heroDescription}>
            Create a polished personal website in minutes—with AI-assisted setup, content you can edit, and themes made to feel like you.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryCta} href="/signup">
              Create your portfolio
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link className={styles.secondaryCta} href="/login">Log in</Link>
            <a className={styles.textCta} href="#themes">Explore themes</a>
          </div>
          <div className={styles.heroProof}>
            <span><Check aria-hidden="true" /> No code required</span>
            <span><Check aria-hidden="true" /> Edit before you publish</span>
            <span><Check aria-hidden="true" /> 35 distinctive themes</span>
          </div>
        </div>
        <ProductShowcase />
      </section>

      <section aria-label="Product capabilities" className={styles.capabilityStrip}>
        <span>Resume upload</span>
        <i />
        <span>Smart extraction</span>
        <i />
        <span>Human editing</span>
        <i />
        <span>Curated themes</span>
        <i />
        <span>One-click publishing</span>
      </section>

      <section className={styles.processSection} id="how-it-works">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionEyebrow}>A clearer way to begin</p>
          <h2>From resume to ready-to-share in four calm steps.</h2>
          <p>Bring the experience. Profolio helps with the structure, presentation, and final polish.</p>
        </div>
        <div className={styles.stepsGrid}>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article className={styles.stepCard} key={step.number}>
                <div className={styles.stepTopline}>
                  <span>{step.number}</span>
                  <Icon aria-hidden="true" />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.benefitsSection} id="features">
        <div className={styles.benefitStatement}>
          <p className={styles.sectionEyebrow}>Built around your real work</p>
          <h2>A portfolio builder that does less guessing and more helping.</h2>
          <p>Start faster without giving up authorship. Every detail remains yours to review, edit, and present.</p>
          <Link className={styles.inlineLink} href="/signup">
            Start with your resume
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.benefitGrid}>
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article className={styles.benefitCard} key={benefit.title}>
                <Icon aria-hidden="true" />
                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.themesSection} id="themes">
        <div className={styles.themeHeading}>
          <div>
            <p className={styles.sectionEyebrow}>Presentation, with personality</p>
            <h2>One story. Many ways to make it feel like you.</h2>
          </div>
          <p>Explore themes across professional, editorial, creative, and developer styles. Switch the look without rewriting the content.</p>
        </div>
        <div className={styles.themeGallery}>
          <article className={styles.themeSample}>
            <ThemeArtwork variant="sage" />
            <div><strong>Quiet Editorial</strong><span>Warm · Minimal</span></div>
          </article>
          <article className={styles.themeSample}>
            <ThemeArtwork variant="clay" />
            <div><strong>Creative Ledger</strong><span>Expressive · Modern</span></div>
          </article>
          <article className={styles.themeSample}>
            <ThemeArtwork variant="ink" />
            <div><strong>Studio Archive</strong><span>Bold · Structured</span></div>
          </article>
        </div>
        <div className={styles.themeCtaRow}>
          <p>Your saved content travels with you from theme to theme.</p>
          <Link className={styles.secondaryCta} href="/signup">
            Create a portfolio to browse themes
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className={styles.finalCta}>
        <span className={styles.finalCtaMark}>P</span>
        <div>
          <p className={styles.sectionEyebrow}>Your work is already worth showing</p>
          <h2>Give it a place to live.</h2>
        </div>
        <Link className={styles.lightCta} href="/signup">
          Create your portfolio
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <footer className={styles.footer} id="footer">
        <div>
          <Brand />
          <p>Resume in. Remarkable portfolio out.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#features">Features</a>
          <a href="#themes">Themes</a>
          <Link href="/signup">Create account</Link>
          <Link href="/login">Login</Link>
        </nav>
        <p className={styles.copyright}>© 2026 The Architects. Built for work worth sharing.</p>
      </footer>
    </main>
  );
}
