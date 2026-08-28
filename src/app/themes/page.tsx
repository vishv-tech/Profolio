import { Palette } from "lucide-react";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { requireActiveUser } from "@/lib/auth/guards";

export default async function ThemesPage() {
  await requireActiveUser();

  return <ModulePlaceholder icon={Palette} title="Theme Selection" />;
}
