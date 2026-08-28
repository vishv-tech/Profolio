import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";

export default function HealthcareProfessionalTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell config={config} layoutKey="career-healthcare-professional">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <PortfolioHeader
          className="rounded-[var(--career-radius)] border p-6 sm:p-8"
          config={config}
          data={data}
        />
        <main className="mt-8 space-y-[var(--career-section-gap)]">
          {sections.map((sectionKey) => (
            <SectionRenderer
              className="rounded-[var(--career-radius)] border p-6"
              data={data}
              key={sectionKey}
              sectionKey={sectionKey}
            />
          ))}
        </main>
      </div>
    </ThemeShell>
  );
}
