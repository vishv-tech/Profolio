import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";

export default function ProductDesignerTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell config={config} layoutKey="career-product-designer">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <PortfolioHeader
          className="max-w-3xl pb-8"
          config={config}
          data={data}
          imageClassName="rounded-[var(--career-radius)]"
        />
        <main
          className="grid items-start border-t pt-8 lg:grid-cols-[1.35fr_0.65fr]"
          style={{ gap: "var(--career-section-gap)" }}
        >
          {sections.map((sectionKey) => (
            <SectionRenderer
              className={`rounded-[var(--career-radius)] p-5 ${
                sectionKey === "projects" || sectionKey === "experience"
                  ? "lg:col-start-1"
                  : "lg:col-start-2"
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
