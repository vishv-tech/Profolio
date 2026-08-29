import { DashboardScreen } from "@/components/admin/dashboard-screen";
import { getDashboardData } from "@/lib/admin/dashboard";
import { requireAdmin } from "@/lib/admin/require-admin";

export default async function AdminPage() {
  const [admin, data] = await Promise.all([requireAdmin(), getDashboardData()]);
  const name = admin.profile.full_name || admin.profile.username || "Admin";

  return <DashboardScreen adminName={name} data={data} />;
}
