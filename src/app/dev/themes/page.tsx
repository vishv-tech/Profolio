import { notFound } from "next/navigation";

import { ThemePlayground } from "./ThemePlayground";

export default function UnifiedThemePlaygroundPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <ThemePlayground />;
}
