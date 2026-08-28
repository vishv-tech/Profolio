export const styles = {
  root: "cc-root",
  creatorCanvas: "cc-creatorCanvas",
  hero: "cc-hero",
  heroTopbar: "cc-heroTopbar",
  brandMark: "cc-brandMark",
  statusDots: "cc-statusDots",
  heroGrid: "cc-heroGrid",
  heroGridWithoutPortrait: "cc-heroGridWithoutPortrait",
  heroCopy: "cc-heroCopy",
  heroKicker: "cc-heroKicker",
  portfolioWord: "cc-portfolioWord",
  identityBlock: "cc-identityBlock",
  headline: "cc-headline",
  socialLinks: "cc-socialLinks",
  linkArrow: "cc-linkArrow",
  portraitSlot: "cc-portraitSlot",
  portraitShell: "cc-portraitShell",
  portraitToolbar: "cc-portraitToolbar",
  portraitImage: "cc-portraitImage",
  portraitFallback: "cc-portraitFallback",
  portraitSticker: "cc-portraitSticker",
  portraitCaption: "cc-portraitCaption",
  heroMarquee: "cc-heroMarquee",
  main: "cc-main",
  reveal: "cc-reveal",
  section: "cc-section",
  sectionHeading: "cc-sectionHeading",
  sectionIndex: "cc-sectionIndex",
  indexRule: "cc-indexRule",
  sectionEyebrow: "cc-sectionEyebrow",
  sectionDescription: "cc-sectionDescription",
  aboutSection: "cc-aboutSection",
  aboutGrid: "cc-aboutGrid",
  aboutMonogram: "cc-aboutMonogram",
  aboutCopy: "cc-aboutCopy",
  projectGrid: "cc-projectGrid",
  projectCard: "cc-projectCard",
  projectCardWide: "cc-projectCardWide",
  projectGraphic: "cc-projectGraphic",
  projectNumber: "cc-projectNumber",
  projectOrb: "cc-projectOrb",
  projectFrameLabel: "cc-projectFrameLabel",
  projectBody: "cc-projectBody",
  cardTopline: "cc-cardTopline",
  tagList: "cc-tagList",
  highlightList: "cc-highlightList",
  actionRow: "cc-actionRow",
  externalAction: "cc-externalAction",
  experienceList: "cc-experienceList",
  experienceItem: "cc-experienceItem",
  experienceNumber: "cc-experienceNumber",
  experienceIdentity: "cc-experienceIdentity",
  experienceStory: "cc-experienceStory",
  metaLine: "cc-metaLine",
  skillGrid: "cc-skillGrid",
  skillCard: "cc-skillCard",
  achievementGrid: "cc-achievementGrid",
  achievementCard: "cc-achievementCard",
  compactList: "cc-compactList",
  compactAccent: "cc-compactAccent",
  credentialList: "cc-credentialList",
  credentialId: "cc-credentialId",
  smallSection: "cc-smallSection",
  languageList: "cc-languageList",
  customSection: "cc-customSection",
  customGrid: "cc-customGrid",
  customCard: "cc-customCard",
  customCardOffset: "cc-customCardOffset",
  customItems: "cc-customItems",
  footer: "cc-footer",
  footerTitle: "cc-footerTitle",
  contactList: "cc-contactList",
  footerNote: "cc-footerNote",
} as const;

const RAW_CONTENT_CREATOR_CSS = String.raw`
.root {
  --creator-soft: color-mix(
    in srgb,
    var(--career-accent) 11%,
    var(--career-surface)
  );
  --creator-soft-strong: color-mix(
    in srgb,
    var(--career-accent) 20%,
    var(--career-surface)
  );
  --creator-line: color-mix(
    in srgb,
    var(--career-border) 76%,
    var(--career-text) 24%
  );
  --creator-shadow: color-mix(
    in srgb,
    var(--career-text) 16%,
    transparent
  );
  --creator-radius-lg: calc(var(--career-radius) + 18px);
  background: var(--career-background);
}

.root *,
.root *::before,
.root *::after {
  box-sizing: border-box;
}

.root a {
  color: inherit;
}

.root a:focus-visible {
  border-radius: 4px;
  outline: 3px solid var(--career-accent);
  outline-offset: 4px;
}

.root h1,
.root h2,
.root h3,
.root h4,
.root p {
  overflow-wrap: anywhere;
}

.creatorCanvas {
  margin: 0 auto;
  max-width: 1600px;
  overflow: clip;
  background: var(--career-background);
}

.hero {
  position: relative;
  isolation: isolate;
  min-height: min(900px, 100svh);
  overflow: hidden;
  border-bottom: 1px solid var(--creator-line);
  background:
    radial-gradient(
      circle at 88% 20%,
      var(--creator-soft-strong) 0,
      transparent 28%
    ),
    var(--career-background);
}

.hero::before {
  position: absolute;
  z-index: -2;
  inset: 0;
  background-image:
    linear-gradient(var(--creator-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--creator-line) 1px, transparent 1px);
  background-size: 54px 54px;
  content: "";
  opacity: 0.28;
  pointer-events: none;
}

.hero::after {
  position: absolute;
  z-index: -1;
  top: 16%;
  right: -9rem;
  width: clamp(18rem, 34vw, 34rem);
  aspect-ratio: 1;
  border: 1px solid var(--career-accent);
  border-radius: 999px;
  content: "";
  opacity: 0.32;
}

.heroTopbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 72px;
  padding: 14px clamp(20px, 4vw, 64px);
  border-bottom: 1px solid var(--creator-line);
  background: color-mix(in srgb, var(--career-surface) 88%, transparent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.heroTopbar > :nth-child(2) {
  color: var(--career-muted);
  text-align: center;
}

.brandMark {
  justify-self: start;
  padding: 9px 12px;
  border: 1px solid var(--career-accent);
  border-radius: 999px;
  background: var(--creator-soft);
}

.statusDots {
  display: flex;
  justify-self: end;
  gap: 6px;
}

.statusDots i {
  display: block;
  width: 9px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--career-accent);
}

.heroGrid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: center;
  min-height: 720px;
  padding: clamp(44px, 6vw, 88px) clamp(20px, 4vw, 64px);
}

.heroCopy {
  z-index: 2;
  display: flex;
  grid-column: 1 / 10;
  grid-row: 1;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.heroKicker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin-bottom: clamp(22px, 3vw, 38px);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.heroKicker span {
  padding: 8px 12px;
  border: 1px solid var(--creator-line);
  border-radius: 999px;
  background: var(--career-surface);
}

.heroKicker span:first-child {
  border-color: color-mix(in srgb, var(--career-accent) 55%, var(--creator-line));
  background: var(--creator-soft);
}

.portfolioWord {
  max-width: 100%;
  margin: 0;
  color: var(--career-text);
  font-family: inherit;
  font-size: clamp(4.2rem, 11.8vw, 12rem);
  font-weight: 820;
  letter-spacing: -0.09em;
  line-height: 0.77;
  text-transform: uppercase;
  white-space: nowrap;
}

.identityBlock {
  width: min(64%, 660px);
  margin-top: clamp(42px, 6vw, 76px);
  padding-left: clamp(16px, 2.4vw, 34px);
  border-left: 4px solid var(--career-accent);
}

.identityBlock > p:first-child {
  margin-bottom: 8px;
  color: var(--career-muted);
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.identityBlock h1 {
  margin: 0;
  font-family: var(--career-heading-font);
  font-size: clamp(2.5rem, 5.5vw, 5.6rem);
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 0.98;
}

.headline {
  max-width: 42rem;
  margin-top: 16px;
  color: var(--career-muted);
  font-size: clamp(1rem, 1.6vw, 1.28rem);
  line-height: 1.55;
}

.socialLinks {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.socialLinks a {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  max-width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--creator-line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--career-surface) 94%, transparent);
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;
}

.socialLinks a > svg {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  color: var(--career-accent);
  stroke-width: 1.8;
}

.socialLinks .linkArrow {
  width: 13px;
  height: 13px;
  color: var(--career-muted);
}

.portraitSlot {
  z-index: 3;
  grid-column: 8 / 13;
  grid-row: 1;
  width: min(100%, 430px);
  margin-top: clamp(52px, 8vw, 100px);
  justify-self: end;
}

.portraitShell {
  position: relative;
  aspect-ratio: 0.79;
  overflow: visible;
  padding: 42px 10px 10px;
  border: 1px solid var(--creator-line);
  border-radius: var(--creator-radius-lg);
  background: var(--career-surface);
  box-shadow:
    14px 18px 0 var(--creator-soft-strong),
    0 24px 70px var(--creator-shadow);
  transform: rotate(1.5deg);
  transition: transform 300ms ease;
}

.portraitToolbar {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  padding: 0 14px;
  border-bottom: 1px solid var(--creator-line);
}

.portraitToolbar span {
  width: 8px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--career-accent);
}

.portraitToolbar small {
  margin-left: auto;
  color: var(--career-muted);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.portraitImage,
.portraitFallback {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: calc(var(--creator-radius-lg) - 10px);
}

.portraitImage {
  display: block;
  object-fit: cover;
  object-position: center;
}

.portraitFallback {
  position: relative;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 18px;
  overflow: hidden;
  padding: 28px;
  border: 1px solid color-mix(in srgb, var(--career-accent) 42%, var(--creator-line));
  background:
    radial-gradient(circle at 50% 40%, var(--creator-soft-strong), transparent 34%),
    linear-gradient(145deg, var(--creator-soft), var(--career-surface));
  text-align: center;
}

.portraitFallback::before,
.portraitFallback::after {
  position: absolute;
  width: 82%;
  aspect-ratio: 1;
  border: 1px solid var(--career-accent);
  border-radius: 50%;
  content: "";
  opacity: 0.25;
}

.portraitFallback::after {
  width: 56%;
}

.portraitFallback > svg {
  position: relative;
  z-index: 1;
  width: 24px;
  height: 24px;
  color: var(--career-accent);
}

.portraitFallback strong {
  position: relative;
  z-index: 1;
  font-family: var(--career-heading-font);
  font-size: clamp(5rem, 10vw, 9rem);
  font-weight: 600;
  letter-spacing: -0.08em;
  line-height: 0.8;
}

.portraitFallback span {
  position: relative;
  z-index: 1;
  max-width: 13rem;
  color: var(--career-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.5;
  text-transform: uppercase;
}

.portraitSticker {
  position: absolute;
  right: -18px;
  bottom: 14%;
  display: grid;
  width: 58px;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid var(--creator-line);
  border-radius: 50%;
  background: var(--career-surface);
  color: var(--career-accent);
  box-shadow: 0 12px 24px var(--creator-shadow);
}

.portraitSticker svg {
  width: 22px;
}

.portraitCaption {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 26px;
  padding-left: 16px;
  color: var(--career-muted);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.heroGridWithoutPortrait .heroCopy {
  grid-column: 1 / 13;
  align-items: center;
  text-align: center;
}

.heroGridWithoutPortrait .identityBlock {
  width: min(760px, 100%);
  padding: 0;
  border: 0;
}

.heroGridWithoutPortrait .portfolioWord {
  font-size: clamp(4.2rem, 13vw, 13rem);
}

.heroGridWithoutPortrait .socialLinks {
  justify-content: center;
}

.heroMarquee {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 18px;
  min-height: 56px;
  padding: 12px clamp(20px, 4vw, 64px);
  border-top: 1px solid var(--creator-line);
  background: var(--creator-soft);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.heroMarquee i {
  width: 8px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--career-accent);
}

.main {
  padding: 0 clamp(20px, 4vw, 64px);
}

.section {
  padding: clamp(72px, 9vw, 132px) 0;
  border-top: 1px solid var(--creator-line);
}

.main > .reveal:first-child .section {
  border-top: 0;
}

.sectionHeading {
  display: grid;
  grid-template-columns: minmax(120px, 0.28fr) minmax(0, 1fr);
  gap: clamp(24px, 4vw, 64px);
  align-items: start;
  margin-bottom: clamp(46px, 7vw, 86px);
}

.sectionIndex {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
  color: var(--career-muted);
  font-size: 0.74rem;
  font-weight: 750;
  letter-spacing: 0.12em;
}

.indexRule {
  display: block;
  width: min(84px, 8vw);
  height: 1px;
  background: var(--career-accent);
}

.sectionEyebrow {
  margin-bottom: 14px;
  color: var(--career-accent);
  font-size: 0.72rem;
  font-weight: 780;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.sectionHeading h2 {
  max-width: 1000px;
  margin: 0;
  font-family: var(--career-heading-font);
  font-size: clamp(3rem, 7.2vw, 7.5rem);
  font-weight: 620;
  letter-spacing: -0.055em;
  line-height: 0.92;
}

.sectionDescription {
  max-width: 42rem;
  margin-top: 22px;
  color: var(--career-muted);
  font-size: clamp(1rem, 1.4vw, 1.18rem);
  line-height: 1.65;
}

.aboutSection {
  position: relative;
}

.aboutGrid {
  display: grid;
  grid-template-columns: minmax(220px, 0.7fr) minmax(0, 1.45fr);
  gap: clamp(26px, 6vw, 92px);
  align-items: stretch;
}

.aboutMonogram {
  position: relative;
  display: flex;
  min-height: 300px;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 26px;
  border: 1px solid var(--creator-line);
  border-radius: var(--creator-radius-lg);
  background: var(--creator-soft);
}

.aboutMonogram::after {
  position: absolute;
  right: -28%;
  bottom: -42%;
  width: 82%;
  aspect-ratio: 1;
  border: 1px solid var(--career-accent);
  border-radius: 50%;
  content: "";
  opacity: 0.45;
}

.aboutMonogram span {
  font-family: var(--career-heading-font);
  font-size: clamp(5rem, 10vw, 10rem);
  font-weight: 650;
  letter-spacing: -0.09em;
  line-height: 0.72;
}

.aboutMonogram small {
  color: var(--career-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.aboutCopy {
  position: relative;
  display: grid;
  align-content: center;
  min-height: 300px;
  padding: clamp(28px, 5vw, 72px);
  border-top: 1px solid var(--creator-line);
  border-bottom: 1px solid var(--creator-line);
}

.aboutCopy > svg {
  position: absolute;
  top: 28px;
  right: 0;
  width: 30px;
  height: 30px;
  color: var(--career-accent);
  stroke-width: 1.4;
}

.aboutCopy p {
  margin: 0;
  font-size: clamp(1.4rem, 2.6vw, 2.55rem);
  letter-spacing: -0.025em;
  line-height: 1.35;
  white-space: pre-line;
}

.projectGrid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--career-section-gap);
}

.projectCard {
  display: grid;
  grid-column: span 5;
  grid-template-rows: minmax(210px, auto) 1fr;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--creator-line);
  border-radius: var(--creator-radius-lg);
  background: var(--career-surface);
  box-shadow: 0 18px 50px color-mix(in srgb, var(--creator-shadow) 50%, transparent);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease;
}

.projectCardWide {
  grid-column: span 7;
}

.projectGraphic {
  position: relative;
  min-height: 220px;
  overflow: hidden;
  border-bottom: 1px solid var(--creator-line);
  background:
    linear-gradient(135deg, transparent 0 48%, var(--creator-line) 48% 49%, transparent 49%),
    var(--creator-soft);
}

.projectGraphic::before {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 42%;
  aspect-ratio: 0.78;
  border: 1px solid var(--career-accent);
  border-radius: calc(var(--career-radius) + 6px);
  background: color-mix(in srgb, var(--career-surface) 72%, transparent);
  box-shadow: 8px 8px 0 var(--creator-soft-strong);
  content: "";
  transform: rotate(4deg);
}

.projectNumber {
  position: absolute;
  bottom: -0.12em;
  left: 18px;
  font-family: var(--career-heading-font);
  font-size: clamp(5.5rem, 10vw, 9.5rem);
  font-weight: 650;
  letter-spacing: -0.08em;
  line-height: 0.78;
}

.projectOrb {
  position: absolute;
  top: 30px;
  left: 28px;
  width: 18px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--career-accent);
  box-shadow:
    28px 0 0 color-mix(in srgb, var(--career-accent) 70%, transparent),
    56px 0 0 color-mix(in srgb, var(--career-accent) 40%, transparent);
}

.projectFrameLabel {
  position: absolute;
  right: 24px;
  bottom: 20px;
  padding: 7px 10px;
  border: 1px solid var(--creator-line);
  border-radius: 999px;
  background: var(--career-surface);
  font-size: 0.6rem;
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.projectBody {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: clamp(24px, 3vw, 42px);
}

.cardTopline {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  color: var(--career-muted);
  font-size: 0.65rem;
  font-weight: 750;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.projectBody h3 {
  margin: 0;
  font-family: var(--career-heading-font);
  font-size: clamp(2rem, 3.5vw, 3.75rem);
  font-weight: 630;
  letter-spacing: -0.045em;
  line-height: 1;
}

.projectBody > p {
  margin-top: 20px;
  color: var(--career-muted);
  font-size: 1rem;
  line-height: 1.72;
}

.tagList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tagList li {
  padding: 8px 11px;
  border: 1px solid var(--creator-line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--creator-soft) 68%, transparent);
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
}

.projectBody .tagList {
  margin-top: 24px;
}

.highlightList {
  display: grid;
  gap: 10px;
  width: 100%;
  margin: 24px 0 0;
  padding: 18px 0 0;
  border-top: 1px solid var(--creator-line);
  list-style: none;
}

.highlightList li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  font-size: 0.88rem;
  line-height: 1.55;
}

.highlightList li > span:first-child {
  color: var(--career-accent);
  font-weight: 800;
}

.actionRow {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto;
  padding-top: 28px;
}

.externalAction {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--career-accent);
  font-size: 0.76rem;
  font-weight: 780;
  text-decoration: none;
  text-transform: uppercase;
}

.externalAction svg {
  width: 15px;
  height: 15px;
}

.experienceList {
  border-top: 1px solid var(--creator-line);
}

.experienceItem {
  display: grid;
  grid-template-columns: minmax(70px, 0.25fr) minmax(190px, 0.75fr) minmax(0, 1.3fr);
  gap: clamp(20px, 4vw, 60px);
  padding: clamp(30px, 5vw, 64px) 0;
  border-bottom: 1px solid var(--creator-line);
}

.experienceNumber {
  color: var(--career-accent);
  font-family: var(--career-heading-font);
  font-size: clamp(2.4rem, 4vw, 4.4rem);
  line-height: 1;
}

.experienceIdentity > p {
  margin-bottom: 8px;
  color: var(--career-muted);
  font-size: 0.7rem;
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.experienceIdentity h3,
.compactList h3,
.credentialList h3 {
  margin: 0;
  font-family: var(--career-heading-font);
  font-size: clamp(1.55rem, 2.4vw, 2.5rem);
  font-weight: 630;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

.metaLine {
  margin-top: 9px;
  color: var(--career-muted);
  font-size: 0.72rem;
  line-height: 1.5;
}

.experienceStory > p:not(.metaLine) {
  margin-top: 14px;
  line-height: 1.7;
}

.skillGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--career-section-gap);
}

.skillCard {
  position: relative;
  min-height: 240px;
  overflow: hidden;
  padding: clamp(24px, 4vw, 48px);
  border: 1px solid var(--creator-line);
  border-radius: var(--creator-radius-lg);
  background: var(--career-surface);
}

.skillCard::after {
  position: absolute;
  top: -22%;
  right: -14%;
  width: 42%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--creator-soft-strong);
  content: "";
}

.skillCard > span {
  color: var(--career-accent);
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.12em;
}

.skillCard h3 {
  position: relative;
  z-index: 1;
  margin: 48px 0 24px;
  font-family: var(--career-heading-font);
  font-size: clamp(2rem, 4vw, 4rem);
  font-weight: 620;
  letter-spacing: -0.05em;
  line-height: 0.95;
}

.skillCard .tagList {
  position: relative;
  z-index: 1;
}

.achievementGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--career-section-gap);
}

.achievementCard {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 22px;
  min-height: 220px;
  padding: clamp(24px, 4vw, 44px);
  border: 1px solid var(--creator-line);
  border-radius: var(--creator-radius-lg);
  background: var(--creator-soft);
}

.achievementCard > svg {
  width: 32px;
  height: 32px;
  color: var(--career-accent);
  stroke-width: 1.4;
}

.achievementCard h3 {
  margin: 0;
  font-family: var(--career-heading-font);
  font-size: clamp(1.8rem, 3vw, 3.2rem);
  font-weight: 620;
  letter-spacing: -0.04em;
  line-height: 1;
}

.achievementCard div > p:not(.metaLine) {
  margin-top: 18px;
  line-height: 1.65;
}

.compactList {
  display: grid;
  gap: 0;
  border-top: 1px solid var(--creator-line);
}

.compactList article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 24px;
  padding: clamp(28px, 4vw, 48px) 0;
  border-bottom: 1px solid var(--creator-line);
}

.compactList article > svg {
  width: 23px;
  height: 23px;
  color: var(--career-accent);
}

.compactList article div > p:not(.metaLine) {
  max-width: 52rem;
  margin-top: 14px;
  line-height: 1.65;
}

.compactList .compactAccent {
  display: inline-block;
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--creator-soft);
  color: var(--career-text);
  font-size: 0.7rem;
  font-weight: 750;
}

.credentialList {
  border-top: 1px solid var(--creator-line);
}

.credentialList article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: clamp(24px, 3.5vw, 42px) 0;
  border-bottom: 1px solid var(--creator-line);
}

.credentialId {
  margin-top: 14px;
  color: var(--career-accent);
  font-size: 0.65rem;
  font-weight: 760;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.smallSection .sectionHeading {
  margin-bottom: 42px;
}

.languageList {
  max-width: 780px;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--creator-line);
  list-style: none;
}

.languageList li {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 0;
  border-bottom: 1px solid var(--creator-line);
}

.languageList li span:first-child {
  font-family: var(--career-heading-font);
  font-size: 1.35rem;
}

.languageList li span:last-child {
  color: var(--career-muted);
  font-size: 0.8rem;
}

.smallSection > .tagList {
  max-width: 800px;
}

.smallSection > .tagList li {
  padding: 12px 16px;
  font-size: 0.82rem;
}

.customSection {
  position: relative;
}

.customGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(24px, 5vw, 72px);
  align-items: start;
}

.customCard {
  overflow: hidden;
  border: 1px solid var(--creator-line);
  border-radius: var(--creator-radius-lg);
  background: var(--career-surface);
}

.customCardOffset {
  margin-top: 72px;
}

.customCard > header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 24px;
  align-items: end;
  min-height: 190px;
  padding: clamp(24px, 4vw, 42px);
  border-bottom: 1px solid var(--creator-line);
  background: var(--creator-soft);
}

.customCard > header > span {
  color: var(--career-accent);
  font-size: 0.7rem;
  font-weight: 760;
  letter-spacing: 0.1em;
}

.customCard h3 {
  margin: 0;
  font-family: var(--career-heading-font);
  font-size: clamp(2.2rem, 4.5vw, 4.8rem);
  font-weight: 620;
  letter-spacing: -0.055em;
  line-height: 0.92;
}

.customItems {
  display: grid;
  gap: 0;
  padding: 0 clamp(24px, 4vw, 42px);
}

.customItems > div {
  padding: 28px 0;
  border-bottom: 1px solid var(--creator-line);
}

.customItems > div:last-child {
  border-bottom: 0;
}

.customItems h4 {
  margin: 0;
  font-size: 1.05rem;
}

.customItems div > p:not(.metaLine) {
  margin-top: 14px;
  color: var(--career-muted);
  line-height: 1.65;
}

.footer {
  display: grid;
  gap: 42px;
  padding: clamp(64px, 9vw, 130px) clamp(20px, 4vw, 64px) 34px;
  border-top: 1px solid var(--creator-line);
  background:
    radial-gradient(circle at 92% 0, var(--creator-soft-strong), transparent 34%),
    var(--creator-soft);
}

.footerTitle > span {
  color: var(--career-muted);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.footerTitle > p {
  max-width: 1100px;
  margin-top: 14px;
  font-family: var(--career-heading-font);
  font-size: clamp(3.2rem, 9vw, 9rem);
  font-weight: 620;
  letter-spacing: -0.07em;
  line-height: 0.86;
}

.contactList {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-style: normal;
}

.contactList > a,
.contactList > span {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  max-width: 100%;
  padding: 11px 14px;
  border: 1px solid var(--creator-line);
  border-radius: 999px;
  background: var(--career-surface);
  font-size: 0.78rem;
  text-decoration: none;
}

.contactList svg {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  color: var(--career-accent);
}

.footer .socialLinks {
  margin-top: 0;
}

.footerNote {
  padding-top: 24px;
  border-top: 1px solid var(--creator-line);
  color: var(--career-muted);
  font-size: 0.65rem;
  font-weight: 760;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.root[data-animation="subtle"] .reveal {
  animation: creatorReveal 560ms ease both;
  animation-delay: var(--creator-delay);
}

.root[data-animation="dynamic"] .reveal {
  animation: creatorReveal 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--creator-delay);
}

.root[data-animation="subtle"] .projectCard:hover {
  transform: translateY(-3px);
}

.root[data-animation="dynamic"] .projectCard:hover {
  box-shadow: 0 28px 70px var(--creator-shadow);
  transform: translateY(-8px) rotate(-0.35deg);
}

.root[data-animation="subtle"] .socialLinks a:hover,
.root[data-animation="dynamic"] .socialLinks a:hover {
  border-color: var(--career-accent);
  background: var(--creator-soft);
  transform: translateY(-2px);
}

.root[data-animation="dynamic"] .portraitShell:hover {
  transform: rotate(0deg) scale(1.01);
}

.root[data-animation="none"] .projectCard,
.root[data-animation="none"] .portraitShell,
.root[data-animation="none"] .socialLinks a {
  transition: none;
}

@keyframes creatorReveal {
  from {
    opacity: 0;
    transform: translateY(22px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1100px) {
  .heroGrid {
    min-height: 650px;
  }

  .heroCopy {
    grid-column: 1 / 9;
  }

  .portraitSlot {
    grid-column: 8 / 13;
    width: min(100%, 360px);
  }

  .identityBlock {
    width: 72%;
  }

  .projectGraphic {
    min-height: 190px;
  }
}

@media (max-width: 900px) {
  .hero {
    min-height: auto;
  }

  .heroGrid {
    grid-template-columns: minmax(0, 1fr);
    gap: 54px;
    min-height: 0;
  }

  .heroCopy,
  .heroGridWithoutPortrait .heroCopy {
    grid-column: 1;
    grid-row: 1;
    align-items: flex-start;
    text-align: left;
  }

  .portraitSlot {
    grid-column: 1;
    grid-row: 2;
    width: min(78vw, 430px);
    margin-top: 0;
    justify-self: center;
  }

  .portfolioWord,
  .heroGridWithoutPortrait .portfolioWord {
    font-size: clamp(4rem, 15vw, 8.5rem);
  }

  .identityBlock,
  .heroGridWithoutPortrait .identityBlock {
    width: min(720px, 100%);
    padding-left: 22px;
    border-left: 4px solid var(--career-accent);
    text-align: left;
  }

  .heroGridWithoutPortrait .socialLinks {
    justify-content: flex-start;
  }

  .projectGrid {
    grid-template-columns: minmax(0, 1fr);
  }

  .projectCard,
  .projectCardWide {
    grid-column: 1;
  }

  .experienceItem {
    grid-template-columns: 70px minmax(0, 1fr);
  }

  .experienceStory {
    grid-column: 2;
  }

  .customCardOffset {
    margin-top: 36px;
  }
}

@media (max-width: 720px) {
  .heroTopbar {
    grid-template-columns: 1fr auto;
  }

  .heroTopbar > :nth-child(2) {
    display: none;
  }

  .heroGrid {
    padding-top: 52px;
    padding-bottom: 64px;
  }

  .sectionHeading {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }

  .sectionIndex {
    padding-top: 0;
  }

  .indexRule {
    width: 72px;
  }

  .aboutGrid,
  .skillGrid,
  .achievementGrid,
  .customGrid {
    grid-template-columns: minmax(0, 1fr);
  }

  .aboutMonogram {
    min-height: 230px;
  }

  .aboutCopy {
    min-height: 0;
    padding: 48px 0 10px;
    border-top: 0;
  }

  .aboutCopy > svg {
    top: 0;
  }

  .customCardOffset {
    margin-top: 0;
  }

  .credentialList article {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 540px) {
  .hero::before {
    background-size: 36px 36px;
  }

  .heroTopbar {
    min-height: 62px;
    padding-inline: 16px;
  }

  .brandMark {
    padding: 8px 10px;
  }

  .heroGrid {
    gap: 46px;
    padding: 42px 16px 56px;
  }

  .heroKicker {
    gap: 7px;
    margin-bottom: 28px;
  }

  .heroKicker span {
    padding: 7px 9px;
    font-size: 0.66rem;
  }

  .portfolioWord,
  .heroGridWithoutPortrait .portfolioWord {
    font-size: clamp(3.25rem, 15.4vw, 5.1rem);
    letter-spacing: -0.085em;
  }

  .identityBlock,
  .heroGridWithoutPortrait .identityBlock {
    margin-top: 38px;
    padding-left: 16px;
  }

  .identityBlock h1 {
    font-size: clamp(2.45rem, 12vw, 4rem);
  }

  .socialLinks {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
  }

  .socialLinks a {
    justify-content: flex-start;
  }

  .socialLinks .linkArrow {
    margin-left: auto;
  }

  .portraitSlot {
    width: min(88vw, 360px);
  }

  .portraitShell {
    box-shadow:
      9px 12px 0 var(--creator-soft-strong),
      0 20px 50px var(--creator-shadow);
  }

  .portraitSticker {
    right: -8px;
    width: 48px;
  }

  .portraitCaption {
    flex-direction: column;
    gap: 6px;
  }

  .heroMarquee {
    justify-content: flex-start;
    overflow: hidden;
    padding-inline: 16px;
    white-space: nowrap;
  }

  .heroMarquee span:nth-of-type(n + 3),
  .heroMarquee i:nth-of-type(n + 3) {
    display: none;
  }

  .main {
    padding-inline: 16px;
  }

  .section {
    padding: 72px 0;
  }

  .sectionHeading {
    margin-bottom: 42px;
  }

  .sectionHeading h2 {
    font-size: clamp(2.65rem, 13vw, 4.2rem);
  }

  .aboutCopy p {
    font-size: 1.35rem;
  }

  .projectCard {
    grid-template-rows: minmax(160px, auto) 1fr;
  }

  .projectGraphic {
    min-height: 160px;
  }

  .projectGraphic::before {
    top: 16px;
    right: 16px;
  }

  .projectNumber {
    font-size: 5.5rem;
  }

  .projectBody {
    padding: 24px 20px;
  }

  .cardTopline {
    flex-direction: column;
    gap: 6px;
  }

  .experienceItem {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .experienceNumber,
  .experienceStory {
    grid-column: 1;
  }

  .experienceNumber {
    font-size: 2rem;
  }

  .skillCard {
    min-height: 210px;
    padding: 24px 20px;
  }

  .achievementCard {
    grid-template-columns: minmax(0, 1fr);
  }

  .compactList article {
    grid-template-columns: minmax(0, 1fr);
  }

  .customCard > header {
    grid-template-columns: minmax(0, 1fr);
    min-height: 160px;
  }

  .footer {
    gap: 34px;
    padding: 72px 16px 28px;
  }

  .contactList {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .contactList > a,
  .contactList > span {
    overflow-wrap: anywhere;
  }
}

@media (prefers-reduced-motion: reduce) {
  .root .reveal {
    animation: none !important;
  }

  .root .projectCard,
  .root .portraitShell,
  .root .socialLinks a {
    transition: none !important;
  }
}
`;

export const CONTENT_CREATOR_CSS = Object.entries(styles)
  .sort(([left], [right]) => right.length - left.length)
  .reduce(
    (css, [className, scopedClassName]) =>
      css.split(`.${className}`).join(`.${scopedClassName}`),
    RAW_CONTENT_CREATOR_CSS,
  );
