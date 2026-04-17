import AdminWorkspace from "@/components/admin/AdminWorkspace";
import { getAdminWorkspaceProps } from "@/lib/adminDashboard";

export default async function AdminPaymentsRoute() {
  const { initialUsers, adminProfile } = await getAdminWorkspaceProps();
  return <AdminWorkspace initialUsers={initialUsers} adminProfile={adminProfile} initialSection="payments" />;
}
