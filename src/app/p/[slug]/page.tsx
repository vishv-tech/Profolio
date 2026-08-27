import { Globe2 } from "lucide-react";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <ModulePlaceholder
      description="Public portfolio rendering will be connected in a later phase."
      eyebrow="Portfolio Preview"
      icon={Globe2}
      title={`Portfolio: ${slug}`}
    />
  );
}
