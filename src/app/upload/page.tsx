import { ProtectedHeader } from "@/components/auth/protected-header";
import { ResumeWorkflow } from "@/components/upload/resume-workflow";
import { requireActiveUser } from "@/lib/auth/guards";
import { getResumeWorkflowState } from "@/lib/resumes/queries";

import styles from "@/components/workspace/workspace.module.css";

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
    <div className={`${styles.shell} flex min-h-svh flex-col`}>
      <ProtectedHeader
        destination={user.profile.role === "admin" ? "/admin" : "/dashboard"}
        email={user.email}
        label={user.profile.role === "admin" ? "Admin workspace" : "User workspace"}
        name={user.profile.full_name || user.profile.username}
      />
      <main className={`${styles.page} ${styles.applicationSurface}`}>
        <div className={styles.narrowContainer}>
        <ResumeWorkflow
          hasRequestedResume={Boolean(params.resume)}
          initialState={initialState}
          key={
            initialState
              ? `${initialState.id}:${initialState.status}`
              : "new-resume"
          }
        />
        </div>
      </main>
    </div>
  );
}
