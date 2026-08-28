import { ArrowRight, FileUp, LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 bg-muted/30 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard aria-hidden="true" className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Your dashboard</h1>
          <p className="text-muted-foreground">
            Start by turning a PDF resume into editable portfolio data.
          </p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <FileUp aria-hidden="true" className="size-5" />
            </div>
            <CardTitle>
              <h2 className="text-lg font-semibold">Create from a resume</h2>
            </CardTitle>
            <CardDescription className="max-w-xl leading-6">
              Upload a private PDF, extract its facts with Gemini, and review
              every section before choosing a portfolio theme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={buttonVariants({ size: "lg" })} href="/upload">
              Upload resume
              <ArrowRight aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
