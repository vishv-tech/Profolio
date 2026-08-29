import { Ban, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/admin-shell";
import {
  formatDate,
  formatNumber,
  Notice,
  PageHeading,
  Pagination,
  StatCard,
  StatusBadge,
} from "@/components/admin/admin-primitives";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { changeUserRole, setAccountStatus } from "@/lib/admin/actions";
import type {
  AccountStatus,
  AdminUser,
  PageResult,
  UserRole,
} from "@/types/admin";

type UserQuery = {
  search: string;
  role?: UserRole;
  accountStatus?: AccountStatus;
  order: "newest" | "oldest";
};

function listHref(query: UserQuery, page: number): string {
  const params = new URLSearchParams({ page: String(page), order: query.order });
  if (query.search) params.set("search", query.search);
  if (query.role) params.set("role", query.role);
  if (query.accountStatus) params.set("status", query.accountStatus);
  return `/admin/users?${params}`;
}

function UserActions({ user }: { user: AdminUser }) {
  const nextStatus = user.account_status === "active" ? "suspended" : "active";
  const nextRole = user.role === "admin" ? "user" : "admin";

  return (
    <details className="admin-row-actions">
      <summary>Manage</summary>
      <div>
        <form action={setAccountStatus}>
          <input name="userId" type="hidden" value={user.id} />
          <input name="accountStatus" type="hidden" value={nextStatus} />
          <ConfirmActionButton
            type="submit"
            confirmation={
              nextStatus === "suspended"
                ? "Suspend this account? The user will immediately lose access to protected workflows."
                : "Reactivate this account? The user will regain access to protected workflows."
            }
          >
            {nextStatus === "suspended" ? "Suspend account" : "Reactivate account"}
          </ConfirmActionButton>
        </form>
        <form action={changeUserRole}>
          <input name="userId" type="hidden" value={user.id} />
          <input name="role" type="hidden" value={nextRole} />
          <ConfirmActionButton
            type="submit"
            confirmation={
              nextRole === "admin"
                ? "Grant this account full administrator access?"
                : "Remove administrator access from this account?"
            }
          >
            Make {nextRole === "admin" ? "administrator" : "standard user"}
          </ConfirmActionButton>
        </form>
      </div>
    </details>
  );
}

export function UserManagementScreen({
  users,
  totalUsers,
  administrators,
  suspendedUsers,
  query,
  message,
}: {
  users: PageResult<AdminUser>;
  totalUsers: number;
  administrators: number;
  suspendedUsers: number;
  query: UserQuery;
  message?: { kind: "success" | "error"; text: string };
}) {
  return (
    <div className="admin-page">
      <PageHeading
        title="User management"
        description="Inspect profile access, suspend accounts, and manage administrator roles."
      />
      <div className="admin-stats admin-stats--three">
        <StatCard icon={Users} label="Total users" value={totalUsers} />
        <StatCard
          icon={ShieldCheck}
          label="Administrators"
          value={administrators}
          tone="green"
        />
        <StatCard icon={Ban} label="Suspended" value={suspendedUsers} tone="red" />
      </div>

      <section className="admin-card admin-manager">
        <div className="admin-manager__heading">
          <h2>All users</h2>
        </div>
        <div className="admin-manager__filters">
          <form action="/admin/users" className="admin-filter-form">
            <input
              name="search"
              type="search"
              defaultValue={query.search}
              placeholder="Search name or username"
              aria-label="Search users"
            />
            <select name="role" defaultValue={query.role ?? ""} aria-label="Filter role">
              <option value="">All roles</option>
              <option value="user">Users</option>
              <option value="admin">Administrators</option>
            </select>
            <select
              name="status"
              defaultValue={query.accountStatus ?? ""}
              aria-label="Filter account status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <select name="order" defaultValue={query.order} aria-label="Sort users">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button className="admin-button admin-button--primary" type="submit">
              Apply
            </button>
          </form>
          <Link href="/admin/users">Clear filters</Link>
        </div>
        <Notice message={message} />
        {users.items.length ? (
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Portfolios</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="admin-person">
                        <Avatar profile={user} small />
                        <span>
                          <strong>{user.full_name || user.username || "Unnamed user"}</strong>
                          {user.email ? <small>{user.email}</small> : null}
                        </span>
                      </span>
                    </td>
                    <td>{user.username ? `@${user.username}` : "—"}</td>
                    <td><StatusBadge value={user.role} /></td>
                    <td>
                      <Link href={`/admin/portfolios?ownerId=${user.id}`}>
                        {formatNumber(user.portfolioCount)}
                      </Link>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td><StatusBadge value={user.account_status} /></td>
                    <td><UserActions user={user} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-manager__empty">No users match these filters.</p>
        )}
        <Pagination
          result={users}
          hrefForPage={(page) => listHref(query, page)}
          label="users"
        />
      </section>
    </div>
  );
}
