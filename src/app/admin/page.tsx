import { ShieldCheck } from "lucide-react";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AdminPage() {
  return (
    <ModulePlaceholder
      description="The admin module will be integrated here in a later phase."
      icon={ShieldCheck}
      title="Admin Module"
    />
  );
}
