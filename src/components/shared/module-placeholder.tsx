import { Blocks, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ModulePlaceholderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
};

export function ModulePlaceholder({
  title,
  description = "Module coming in the next development phase.",
  eyebrow = "The Architects",
  icon: Icon = Blocks,
}: ModulePlaceholderProps) {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-muted/30 px-6 py-16">
      <Card className="w-full max-w-lg">
        <CardHeader className="gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <Badge variant="secondary">Foundation</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {eyebrow}
            </p>
            <CardTitle>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            </CardTitle>
            <CardDescription className="text-base leading-7">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </main>
  );
}
