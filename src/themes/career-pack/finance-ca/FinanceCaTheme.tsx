import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";

export default function FinanceCaTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell config={config} layoutKey="career-finance-ca">
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-10">
        <PortfolioHeader className="border-b-4 pb-8" config={config} data={data} />
        <main className="mt-4">
          {sections.map((sectionKey) => (
            <SectionRenderer
              className="grid border-b py-7 md:grid-cols-[10rem_1fr] md:gap-8 md:[&>h2]:pt-1"
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
