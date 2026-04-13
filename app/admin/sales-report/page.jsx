import AdminWorkspace from "@/components/admin/AdminWorkspace";
import { getAdminWorkspaceProps } from "@/lib/adminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminSalesReportPage() {
  const { initialUsers, adminProfile } = await getAdminWorkspaceProps();

  return <AdminWorkspace initialUsers={initialUsers} adminProfile={adminProfile} initialSection="sales-report" />;
}
