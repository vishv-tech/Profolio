import { ProtectedHeader } from "@/components/auth/protected-header";
import { ResumeWorkflow } from "@/components/upload/resume-workflow";
import { requireActiveUser } from "@/lib/auth/guards";
import { getResumeWorkflowState } from "@/lib/resumes/queries";

export const maxDuration = 300;

type UploadPageProps = {
  searchParams: Promise<{ resume?: string | string[] }>;
};

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const user = await requireActiveUser();
  const params = await searchParams;
  const resumeParam =
    typeof params.resume === "string" ? params.resume : undefined;
  const initialState = resumeParam
    ? await getResumeWorkflowState(resumeParam)
    : null;

  return (
    <div className="min-h-svh bg-muted/30">
      <ProtectedHeader
        destination={user.profile.role === "admin" ? "/admin" : "/dashboard"}
        email={user.email}
        label={user.profile.role === "admin" ? "Admin workspace" : "User workspace"}
      />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <ResumeWorkflow
          hasRequestedResume={Boolean(params.resume)}
          initialState={initialState}
          key={
            initialState
              ? `${initialState.id}:${initialState.status}`
              : "new-resume"
          }
        />
      </main>
    </div>
  );
}
