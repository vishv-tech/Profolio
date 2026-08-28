import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";

export default function ContentCreatorTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell config={config} layoutKey="career-content-creator">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <PortfolioHeader
          className="mx-auto max-w-3xl border-b pb-10"
          config={config}
          data={data}
          textAlign="center"
        />
        <main
          className="mt-10 grid items-start md:grid-cols-2"
          style={{ gap: "var(--career-section-gap)" }}
        >
          {sections.map((sectionKey) => (
            <SectionRenderer
              className={`border p-5 ${
                sectionKey === "projects" || sectionKey === "customSections"
                  ? "md:col-span-2"
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
