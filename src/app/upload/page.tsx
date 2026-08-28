import { Upload } from "lucide-react";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { requireActiveUser } from "@/lib/auth/guards";

export default async function UploadPage() {
  await requireActiveUser();

  return <ModulePlaceholder icon={Upload} title="Resume Upload" />;
}
