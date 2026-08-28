import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";

export default function LegalProfessionalTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell config={config} layoutKey="career-legal-professional">
      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-10 sm:py-20">
        <PortfolioHeader
          className="border-y py-10"
          config={config}
          data={data}
          textAlign="center"
        />
        <main className="mt-10 space-y-10">
          {sections.map((sectionKey) => (
            <SectionRenderer
              className="border-b pb-10 [&_p]:max-w-prose"
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
