import { notFound } from "next/navigation";

import { CareerThemePlayground } from "./CareerThemePlayground";

export default function CareerThemesPlaygroundPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <CareerThemePlayground />;
}
