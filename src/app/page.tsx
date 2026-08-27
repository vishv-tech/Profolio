import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-16">
      <Card className="w-full max-w-2xl">
        <CardHeader className="gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText aria-hidden="true" className="size-5" />
            </div>
            <Badge variant="secondary">Project Foundation</Badge>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              The Architects
            </p>
            <CardTitle>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Turn your resume into a living professional portfolio.
              </h1>
            </CardTitle>
            <CardDescription className="max-w-xl text-base leading-7">
              The application foundation is ready. Product workflows will be
              connected in the next development phases.
            </CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-3 pt-1 sm:flex-row">
          <Link className={buttonVariants({ size: "lg" })} href="/signup">
            Get started
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "lg" })}
            href="/login"
          >
            Log in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
