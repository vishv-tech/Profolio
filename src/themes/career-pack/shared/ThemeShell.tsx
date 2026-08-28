import type { ReactNode } from "react";

import type { ThemeConfig } from "@/types/theme";

import { getCareerThemeStyle } from "./theme-style";

interface ThemeShellProps {
  children: ReactNode;
  className?: string;
  config: ThemeConfig;
  layoutKey: string;
}

export function ThemeShell({
  children,
  className = "",
  config,
  layoutKey,
}: ThemeShellProps) {
  return (
    <div
      className={`min-h-screen w-full overflow-hidden ${className}`}
      data-animation={config.appearance.animationIntensity}
      data-color-mode={config.appearance.colorMode}
      data-theme-layout={layoutKey}
      style={getCareerThemeStyle(config)}
    >
      {children}
    </div>
  );
}
