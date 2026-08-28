import type { ThemeComponentProps } from "../types";
import {
  getVisibleThemeSections,
  PortfolioHeader,
  SectionRenderer,
  ThemeShell,
} from "../shared";

export default function MechanicalEngineerTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <ThemeShell config={config} layoutKey="career-mechanical-engineer">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-10 sm:py-14">
        <PortfolioHeader className="border-l-4 pl-5" config={config} data={data} />
        <main
          className="mt-12 border-l pl-5 sm:pl-8"
          style={{ borderColor: "var(--career-border)" }}
        >
          {sections.map((sectionKey) => (
            <SectionRenderer
              className="relative border-b py-7 before:absolute before:-left-[calc(1.25rem+5px)] before:top-8 before:size-2.5 before:rounded-full before:bg-[var(--career-accent)] sm:before:-left-[calc(2rem+5px)]"
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
