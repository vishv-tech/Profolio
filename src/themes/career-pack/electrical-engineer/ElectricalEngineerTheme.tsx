import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";

export default function ElectricalEngineerTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell config={config} layoutKey="career-electrical-engineer">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <PortfolioHeader
          className="border-y py-8"
          config={config}
          data={data}
          imageClassName="rounded-none"
        />
        <main
          className="mt-8 grid md:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "var(--career-section-gap)" }}
        >
          {sections.map((sectionKey) => (
            <SectionRenderer
              className={`border-t-2 p-4 ${
                sectionKey === "experience" || sectionKey === "projects"
                  ? "lg:col-span-2"
                  : ""
              }`}
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
