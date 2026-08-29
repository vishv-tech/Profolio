import { BriefcaseBusiness, FileText, Search, Users } from "lucide-react";
import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/admin/admin-primitives";
import { getAdminPortfolios, getAdminResumes, getAdminUsers } from "@/lib/admin/queries";

function queryValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const query = queryValue((await searchParams).q);
  const results = query ? await Promise.all([getAdminUsers({ search: query, pageSize: "8" }), getAdminPortfolios({ search: query, pageSize: "8" }), getAdminResumes({ search: query, pageSize: "8" })]) : null;
  return <div className="admin-page"><PageHeading title="Search" description={query ? `Results for “${query}”` : "Search users, portfolio metadata, and resume filenames."} />{results ? <div className="admin-search-results"><section className="admin-card admin-search-result"><header><Users aria-hidden="true" /><h2>Users ({results[0].total})</h2></header>{results[0].items.length ? <ul>{results[0].items.map((user) => <li key={user.id}><Link href={`/admin/users?search=${encodeURIComponent(user.username || user.full_name || "")}`}><strong>{user.full_name || user.username || "Unnamed user"}</strong><small>{user.username ? `@${user.username}` : "No username"}</small></Link></li>)}</ul> : <p>No users found.</p>}</section><section className="admin-card admin-search-result"><header><BriefcaseBusiness aria-hidden="true" /><h2>Portfolios ({results[1].total})</h2></header>{results[1].items.length ? <ul>{results[1].items.map((portfolio) => <li key={portfolio.id}><Link href={`/admin/portfolios?search=${encodeURIComponent(portfolio.slug)}`}><strong>{portfolio.title}</strong><small>/{portfolio.slug}</small></Link></li>)}</ul> : <p>No portfolios found.</p>}</section><section className="admin-card admin-search-result"><header><FileText aria-hidden="true" /><h2>Resumes ({results[2].total})</h2></header>{results[2].items.length ? <ul>{results[2].items.map((resume) => <li key={resume.id}><Link href={`/admin/resumes?search=${encodeURIComponent(resume.file_name)}`}><strong>{resume.file_name}</strong><small>{resume.status}</small></Link></li>)}</ul> : <p>No resumes found.</p>}</section></div> : <EmptyState icon={Search} title="Start a search" description="Use the search field above to find operational records." />}</div>;
}
