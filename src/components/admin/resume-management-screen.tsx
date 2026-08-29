import { CircleCheck, FileText, LoaderCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/admin-shell";
import {
  EmptyState,
  formatDate,
  PageHeading,
  Pagination,
  StatCard,
  StatusBadge,
} from "@/components/admin/admin-primitives";
import type { AdminResume, PageResult } from "@/types/admin";

type ResumeQuery = {
  search: string;
  status: "all" | "uploaded" | "processing" | "completed" | "failed";
  ai: "all" | "yes" | "no";
  ownerId: string;
  order: "newest" | "oldest" | "updated";
};

function listHref(query: ResumeQuery, page: number): string {
  const params = new URLSearchParams({ status: query.status, ai: query.ai, order: query.order });
  if (page > 1) params.set("page", String(page));
  if (query.search) params.set("search", query.search);
  if (query.ownerId) params.set("ownerId", query.ownerId);
  return `/admin/resumes?${params}`;
}

export function ResumeManagementScreen({
  resumes,
  stats,
  owners,
  query,
}: {
  resumes: PageResult<AdminResume>;
  stats: { totalResumes: number; processingResumes: number; completedResumes: number; failedResumes: number };
  owners: { id: string; full_name: string | null; username: string | null }[];
  query: ResumeQuery;
}) {
  return <div className="admin-page">
    <PageHeading title="Resume operations" description="Monitor uploads and extraction state without exposing private files or extracted resume content." />
    <div className="admin-stats admin-stats--four">
      <StatCard icon={FileText} label="Total resumes" value={stats.totalResumes} />
      <StatCard icon={LoaderCircle} label="Processing" value={stats.processingResumes} tone="purple" />
      <StatCard icon={CircleCheck} label="Completed" value={stats.completedResumes} tone="green" />
      <StatCard icon={TriangleAlert} label="Failed" value={stats.failedResumes} tone="red" />
    </div>
    <section className="admin-card admin-manager">
      <div className="admin-manager__heading"><h2>Resume records</h2></div>
      <div className="admin-manager__filters">
        <form action="/admin/resumes" className="admin-filter-form">
          <input name="search" type="search" defaultValue={query.search} placeholder="Search filename" aria-label="Search resumes" />
          <select name="status" defaultValue={query.status} aria-label="Filter resume status"><option value="all">All statuses</option><option value="uploaded">Uploaded</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option></select>
          <select name="ai" defaultValue={query.ai} aria-label="Filter AI improvement"><option value="all">AI: All</option><option value="yes">AI enabled</option><option value="no">AI disabled</option></select>
          <select name="ownerId" defaultValue={query.ownerId} aria-label="Filter owner"><option value="">All owners</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name || owner.username || "Unnamed user"}</option>)}</select>
          <select name="order" defaultValue={query.order} aria-label="Sort resumes"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="updated">Recently updated</option></select>
          <button className="admin-button admin-button--primary" type="submit">Apply</button>
        </form>
        <Link href="/admin/resumes">Clear filters</Link>
      </div>
      {resumes.items.length ? <div className="admin-table-scroll"><table>
        <thead><tr><th>Filename</th><th>Owner</th><th>Status</th><th>AI improvement</th><th>Uploaded</th><th>Updated</th></tr></thead>
        <tbody>{resumes.items.map((resume) => {
          const owner = resume.owner?.full_name || resume.owner?.username || "Unassigned";
          return <tr key={resume.id}><td><strong>{resume.file_name}</strong><small>{resume.id}</small></td><td><span className="admin-person">{resume.owner ? <Avatar profile={resume.owner} small /> : null}{owner}</span></td><td><StatusBadge value={resume.status} /></td><td>{resume.improve_with_ai ? "Enabled" : "Disabled"}</td><td>{formatDate(resume.created_at)}</td><td>{formatDate(resume.updated_at)}</td></tr>;
        })}</tbody>
      </table></div> : <EmptyState icon={FileText} title="No resumes found" description="No resume records match the selected filters." />}
      <Pagination result={resumes} hrefForPage={(page) => listHref(query, page)} label="resumes" />
    </section>
  </div>;
}
