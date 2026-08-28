import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";

export default function ArchitectDesignerTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell config={config} layoutKey="career-architect-designer">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
        <PortfolioHeader
          className="max-w-4xl border-l-8 pl-6"
          config={config}
          data={data}
          imageClassName="rounded-none"
        />
        <main
          className="mt-14 grid items-start md:grid-cols-2"
          style={{ gap: "var(--career-section-gap)" }}
        >
          {sections.map((sectionKey, index) => (
            <SectionRenderer
              className={`min-h-40 border p-5 ${
                sectionKey === "projects" || index % 4 === 0 ? "md:col-span-2" : ""
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
