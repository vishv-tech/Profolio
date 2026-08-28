import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";

export default function BusinessConsultingTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell config={config} layoutKey="career-business-consulting">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <PortfolioHeader
          className="border-b pb-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-end"
          config={config}
          data={data}
        />
        <main
          className="mt-8 grid items-start md:grid-cols-2"
          style={{ gap: "var(--career-section-gap)" }}
        >
          {sections.map((sectionKey) => (
            <SectionRenderer
              className={`border-t-4 py-5 ${
                sectionKey === "summary" || sectionKey === "experience"
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
