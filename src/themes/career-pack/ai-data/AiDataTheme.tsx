import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";

export default function AiDataTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell config={config} layoutKey="career-ai-data">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="border p-1">
          <PortfolioHeader className="border-b p-5 sm:p-8" config={config} data={data} />
          <main className="grid md:grid-cols-2">
            {sections.map((sectionKey, index) => (
              <SectionRenderer
                className={`border p-5 ${index === 0 ? "md:col-span-2" : ""}`}
                data={data}
                key={sectionKey}
                sectionKey={sectionKey}
              />
            ))}
          </main>
        </div>
      </div>
    </ThemeShell>
  );
}
