import { Blocks, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import styles from "./status-page.module.css";

type ModulePlaceholderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
};

export function ModulePlaceholder({
  title,
  description = "Module coming in the next development phase.",
  eyebrow = "Profolio",
  icon: Icon = Blocks,
}: ModulePlaceholderProps) {
  return (
    <main className={`${styles.page} ${styles.placeholderPage}`}>
      <Card>
        <CardHeader className="gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className={styles.icon}>
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
